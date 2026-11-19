import { useEffect, useRef } from 'react';
import cytoscape, { type Core, type ElementDefinition, type NodeSingular, type StylesheetJsonBlock } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { GraphData, GraphEdge, GraphNode } from './types';

// Register the Dagre directed-graph layout once at module load time.
cytoscape.use(dagre);

/** Special id for the invisible ghost node that draws the start state's incoming arrow. */
const START_GHOST_ID = '__start_ghost__';
/** Special id for the incoming start arrow edge. */
const START_EDGE_ID = '__start_edge__';

/** Cytoscape stylesheet implementing the automaton drawing rules. */
const graphStylesheet: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      shape: 'ellipse',
      width: 48,
      height: 48,
      label: 'data(label)',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      'font-size': 13,
      'font-weight': 600,
      color: '#1f2330',
      'background-color': '#ffffff',
      'border-width': 2,
      'border-style': 'solid',
      'border-color': '#475569',
    },
  },
  {
    selector: 'node.accepting',
    style: {
      'border-style': 'double',
      'border-width': 6,
      'border-color': '#146c34',
      'background-color': '#e7f7ec',
    },
  },
  {
    selector: 'node.dead',
    style: {
      'border-style': 'dashed',
      'border-width': 2,
      'border-color': '#9aa0ac',
      'background-color': '#f4f5f9',
      color: '#6b7180',
      'font-style': 'italic',
    },
  },
  {
    selector: 'node.is-new',
    style: {
      'border-color': '#4f46e5',
      'border-width': 4,
      'background-color': '#eef0ff',
    },
  },
  {
    selector: 'node.accepting.is-new',
    style: {
      'border-style': 'double',
      'border-width': 7,
      'border-color': '#4f46e5',
    },
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-color': '#f59f00',
      'border-width': 4,
      'background-color': '#fff3bf',
    },
  },
  {
    selector: 'node.accepting.highlighted',
    style: {
      'border-style': 'double',
      'border-width': 7,
      'border-color': '#d97706',
      'background-color': '#fef3c7',
    },
  },
  {
    selector: 'node.start-ghost',
    style: {
      width: 1,
      height: 1,
      opacity: 0,
      events: 'no',
      label: '',
      'border-width': 0,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1,
      'curve-style': 'bezier',
      'control-point-step-size': 44,
      'loop-direction': '-45deg',
      'loop-sweep': '55deg',
      label: 'data(label)',
      'text-wrap': 'wrap',
      'font-family': 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      'font-size': 13,
      'font-weight': 600,
      color: '#1f2330',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.9,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'text-margin-y': -8,
    },
  },
  {
    selector: 'edge.dashed',
    style: {
      'line-style': 'dashed',
      'line-dash-pattern': [6, 4],
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      width: 3.5,
      'line-color': '#f59f00',
      'target-arrow-color': '#f59f00',
      color: '#b45309',
      'text-background-color': '#fff3bf',
      'text-background-opacity': 1,
    },
  },
  {
    selector: 'edge.start-edge',
    style: {
      width: 2.5,
      'line-color': '#4f46e5',
      'target-arrow-color': '#4f46e5',
      'curve-style': 'straight',
      label: '',
      events: 'no',
    },
  },
  {
    selector: '.hidden',
    style: {
      opacity: 0,
      events: 'no',
    },
  },
];

/**
 * Generic automaton graph viewer powered by Cytoscape.js.
 * Computes the layout ONCE whenever `layoutKey` changes, and thereafter only
 * updates element classes and labels in place so node positions stay rock-solid while stepping.
 */
export default function GraphView({
  title,
  subtitle,
  graph,
  layoutKey,
}: {
  title: string;
  subtitle?: string;
  graph: GraphData;
  layoutKey: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const appliedLayoutKeyRef = useRef<string | null>(null);

  // 1. Mount and unmount: create one Cytoscape instance and clean it up safely (even in StrictMode double-mount).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ensure no leftover DOM children or previous instance exist in this container.
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
    container.innerHTML = '';

    const cy = cytoscape({
      container,
      elements: [],
      style: graphStylesheet,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autounselectify: true,
      minZoom: 0.3,
      maxZoom: 2.5,
    });
    cyRef.current = cy;
    appliedLayoutKeyRef.current = null;

    // Keep the canvas sized properly when the container resizes (e.g. laptop <-> phone layout).
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (cyRef.current && !cyRef.current.destroyed()) {
              cyRef.current.resize();
              cyRef.current.fit(undefined, 28);
            }
          })
        : null;
    observer?.observe(container);

    return () => {
      observer?.disconnect();
      cy.destroy();
      if (cyRef.current === cy) {
        cyRef.current = null;
      }
      appliedLayoutKeyRef.current = null;
    };
  }, []);

  // 2. Sync graph elements: run layout ONLY when layoutKey changes; otherwise update classes/labels in place.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    if (appliedLayoutKeyRef.current !== layoutKey) {
      appliedLayoutKeyRef.current = layoutKey;
      rebuildAndLayout(cy, graph);
    } else {
      updateInPlace(cy, graph);
    }
  }, [graph, layoutKey]);

  // Fit all nodes comfortably inside the viewport on demand.
  function handleFit() {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) {
      cy.fit(undefined, 28);
    }
  }

  return (
    <div className="graph-panel">
      <div className="graph-panel-header">
        <div>
          <h4 className="graph-panel-title">{title}</h4>
          {subtitle && <p className="graph-panel-subtitle">{subtitle}</p>}
        </div>
        <button type="button" className="button secondary graph-fit-btn" onClick={handleFit}>
          Fit view
        </button>
      </div>
      <div ref={containerRef} className="graph-canvas" aria-label={`${title} graph`} />
    </div>
  );
}

/**
 * Loads all nodes and edges into Cytoscape, runs the Dagre left-to-right layout once,
 * positions the invisible start-arrow source to the left of the start state, and fits the view.
 */
function rebuildAndLayout(cy: Core, graph: GraphData) {
  cy.elements().remove();

  const elements: ElementDefinition[] = [];
  const startNode = graph.nodes.find((n) => n.start);

  for (const node of graph.nodes) {
    elements.push({
      group: 'nodes',
      data: { id: node.id, label: node.label },
      classes: nodeClasses(node),
    });
  }

  for (const edge of graph.edges) {
    elements.push({
      group: 'edges',
      data: { id: edge.id, source: edge.from, target: edge.to, label: edge.label },
      classes: edgeClasses(edge),
    });
  }

  cy.add(elements);

  // Run Dagre layout on the real automaton nodes and edges first.
  const layout = cy.layout({
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 70,
    rankSep: 100,
    edgeSep: 35,
    padding: 28,
    animate: false,
  } as unknown as cytoscape.LayoutOptions);
  layout.run();

  // Gently stagger collinear horizontal ranks so long return edges (e.g. {q0,q2} -> {q0})
  // never pass directly through intermediate nodes or opposite-direction arcs.
  const realNodes = cy.nodes().filter((n) => n.id() !== START_GHOST_ID).toArray() as NodeSingular[];
  if (realNodes.length >= 3) {
    const sorted = realNodes.sort((a, b) => a.position('x') - b.position('x'));
    sorted.forEach((node, idx) => {
      if (idx % 2 === 1) {
        node.position('y', node.position('y') + 42);
      }
    });
  }

  // Add the incoming start arrow anchored 55px to the left of the start node.
  if (startNode) {
    const targetEl = cy.getElementById(startNode.id);
    const pos = targetEl.position();
    cy.add([
      {
        group: 'nodes',
        data: { id: START_GHOST_ID, label: '' },
        position: { x: pos.x - 62, y: pos.y },
        locked: true,
        grabbable: false,
        classes: 'start-ghost',
      },
      {
        group: 'edges',
        data: { id: START_EDGE_ID, source: START_GHOST_ID, target: startNode.id, label: '' },
        classes: startNode.hidden ? 'start-edge hidden' : 'start-edge',
      },
    ]);

    // Keep the start arrow attached if the user drags the start state.
    targetEl.on('position', () => {
      const newPos = targetEl.position();
      const ghost = cy.getElementById(START_GHOST_ID);
      ghost.unlock();
      ghost.position({ x: newPos.x - 62, y: newPos.y });
      ghost.lock();
    });
  }

  cy.fit(undefined, 28);
}

/**
 * Updates node and edge classes and labels in place without changing any node positions.
 */
function updateInPlace(cy: Core, graph: GraphData) {
  cy.batch(() => {
    for (const node of graph.nodes) {
      const el = cy.getElementById(node.id);
      if (el.nonempty()) {
        el.data('label', node.label);
        el.classes(nodeClasses(node));
      }
    }

    const startNode = graph.nodes.find((n) => n.start);
    const startEdge = cy.getElementById(START_EDGE_ID);
    if (startEdge.nonempty() && startNode) {
      startEdge.classes(startNode.hidden ? 'start-edge hidden' : 'start-edge');
    }

    for (const edge of graph.edges) {
      const el = cy.getElementById(edge.id);
      if (el.nonempty()) {
        el.data('label', edge.label);
        el.classes(edgeClasses(edge));
      }
    }
  });
}

/** Builds the space-separated Cytoscape class string for a GraphNode. */
function nodeClasses(node: GraphNode): string {
  const classes: string[] = [];
  if (node.accepting) classes.push('accepting');
  if (node.dead) classes.push('dead');
  if (node.hidden) classes.push('hidden');
  if (node.highlighted) classes.push('highlighted');
  if (node.isNew) classes.push('is-new');
  return classes.join(' ');
}

/** Builds the space-separated Cytoscape class string for a GraphEdge. */
function edgeClasses(edge: GraphEdge): string {
  const classes: string[] = [];
  if (edge.dashed) classes.push('dashed');
  if (edge.hidden) classes.push('hidden');
  if (edge.highlighted) classes.push('highlighted');
  return classes.join(' ');
}
