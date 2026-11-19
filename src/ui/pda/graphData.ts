// Pure function converting a PDA into generic GraphData for GraphView.
import { EPSILON, type PDA, type PdaTransition } from '../../algorithms/pda';
import type { GraphData, GraphEdge, GraphNode } from '../graph/types';

/** Formats a single PDA transition as "input, top / push" (using ε for empty push). */
export function formatPdaEdgeLabel(t: PdaTransition): string {
  const pushText = t.push === '' ? EPSILON : t.push;
  return `${t.input}, ${t.top} / ${pushText}`;
}

/**
 * Converts a PDA into GraphData:
 * - Marks start state and accepting states (double border in final-state mode).
 * - Merges parallel edges between the same (from, to) pair using newline separators.
 * - Highlights `activeState` and `activeTransition` for the current step.
 */
export function pdaToGraph(
  machine: PDA,
  activeState?: string,
  activeTransition?: PdaTransition | null
): GraphData {
  const acceptingSet = new Set(machine.acceptanceMode === 'final-state' ? machine.accepting : []);

  const nodes: GraphNode[] = machine.states.map((state) => ({
    id: state,
    label: state,
    start: state === machine.start,
    accepting: acceptingSet.has(state),
    highlighted: state === activeState,
  }));

  const byPair = new Map<string, { from: string; to: string; items: PdaTransition[] }>();
  for (const t of machine.transitions) {
    const key = `${t.from}\0${t.to}`;
    const entry = byPair.get(key) ?? { from: t.from, to: t.to, items: [] };
    entry.items.push(t);
    byPair.set(key, entry);
  }

  const edges: GraphEdge[] = [];
  for (const { from, to, items } of byPair.values()) {
    const label = items.map(formatPdaEdgeLabel).join('\n');
    const isHighlighted = Boolean(
      activeTransition &&
        items.some(
          (t) =>
            t.from === activeTransition.from &&
            t.to === activeTransition.to &&
            t.input === activeTransition.input &&
            t.top === activeTransition.top &&
            t.push === activeTransition.push
        )
    );
    edges.push({
      id: `${from}->${to}`,
      from,
      to,
      label,
      highlighted: isHighlighted,
    });
  }

  return { nodes, edges };
}
