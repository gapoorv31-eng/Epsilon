// Generic graph data types used by GraphView.
// Contains no imports specific to any single algorithm, so any automaton or graph
// algorithm can render its states and transitions with the same component.

/** One state (node) in a directed automaton graph. */
export interface GraphNode {
  /** Unique identifier for the node (e.g. "q0" or "{q0,q1}"). */
  id: string;
  /** Text displayed inside the circle. */
  label: string;
  /** True if this is the start state (draws an incoming arrow from nowhere). */
  start?: boolean;
  /** True if this is an accepting state (drawn with a double border). */
  accepting?: boolean;
  /** True if this is the dead state ∅ (drawn with a dashed border and muted colour). */
  dead?: boolean;
  /** True if the node has not been discovered yet in step-by-step mode. */
  hidden?: boolean;
  /** True if the node is being processed or highlighted in the current step. */
  highlighted?: boolean;
  /** True if the node was discovered for the first time in the current step. */
  isNew?: boolean;
}

/** One directed transition (edge) between two nodes. */
export interface GraphEdge {
  /** Unique identifier for the edge. */
  id: string;
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** Label shown on the edge (e.g. "a, b" or "ε"). */
  label: string;
  /** True for ε-transitions (drawn as a dashed line). */
  dashed?: boolean;
  /** True if the transition has not been revealed yet in step-by-step mode. */
  hidden?: boolean;
  /** True if the transition is being processed in the current step. */
  highlighted?: boolean;
}

/** Complete generic description of a graph for GraphView. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
