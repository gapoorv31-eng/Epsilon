// Pure functions that convert NFA and (partial/full) DFA objects into generic GraphData.
// Contains no React or DOM imports so it can be unit-tested directly with Vitest.
import { DEAD_STATE, EPSILON, type DFA, type NFA } from '../../algorithms/nfaToDfa';
import type { GraphData, GraphEdge, GraphNode } from '../graph/types';
import type { PartialDfa } from './partialDfa';

/**
 * Converts an NFA into generic GraphData.
 * - One node per NFA state (marking start, accepting, and any teaching-highlighted states).
 * - Multiple symbols between the same (from, to) state pair are merged into one edge (e.g. "a,b").
 * - ε-transitions are marked with `dashed: true` (and combined into the label if other symbols share the edge, or kept dashed when ε is present).
 */
export function nfaToGraph(nfa: NFA, highlightedStates: string[] = []): GraphData {
  const highlightedSet = new Set(highlightedStates);

  const nodes: GraphNode[] = nfa.states.map((state) => ({
    id: state,
    label: state,
    start: state === nfa.start,
    accepting: nfa.accepting.includes(state),
    highlighted: highlightedSet.has(state),
  }));

  const edges: GraphEdge[] = [];
  const symbolsToCheck = [...nfa.alphabet.filter((s) => s !== EPSILON), EPSILON];

  for (const from of nfa.states) {
    const byTarget = new Map<string, string[]>();
    const fromTransitions = nfa.transitions[from] ?? {};

    for (const symbol of symbolsToCheck) {
      const targets = fromTransitions[symbol] ?? [];
      for (const to of targets) {
        const list = byTarget.get(to) ?? [];
        if (!list.includes(symbol)) {
          list.push(symbol);
        }
        byTarget.set(to, list);
      }
    }

    for (const [to, symbols] of byTarget.entries()) {
      edges.push({
        id: `${from}->${to}`,
        from,
        to,
        label: symbols.join(','),
        dashed: symbols.includes(EPSILON),
      });
    }
  }

  return { nodes, edges };
}

/**
 * Converts a DFA (and optional step-by-step PartialDfa from buildPartialDfa) into generic GraphData.
 * - All DFA states and merged edges are always included so Cytoscape computes a stable layout once.
 * - States and edges not yet revealed in `partial` are marked `hidden: true`.
 * - The state and edge currently being processed are marked `highlighted: true`.
 * - A state discovered in the current step is marked `isNew: true`.
 */
export function dfaToGraph(dfa: DFA, partial?: PartialDfa | null): GraphData {
  const revealedStates = partial ? new Set(partial.states.map((s) => s.name)) : null;

  const nodes: GraphNode[] = dfa.states.map((state) => ({
    id: state.name,
    label: state.name,
    start: state.name === dfa.start,
    accepting: dfa.accepting.includes(state.name),
    dead: state.name === DEAD_STATE,
    hidden: revealedStates ? !revealedStates.has(state.name) : false,
    highlighted: partial ? partial.activeFrom === state.name : false,
    isNew: partial ? partial.newlyDiscovered === state.name : false,
  }));

  const edges: GraphEdge[] = [];

  for (const state of dfa.states) {
    const from = state.name;
    const byTarget = new Map<string, string[]>();

    for (const symbol of dfa.alphabet) {
      const to = dfa.transitions[from]?.[symbol];
      if (to !== undefined) {
        const list = byTarget.get(to) ?? [];
        list.push(symbol);
        byTarget.set(to, list);
      }
    }

    for (const [to, allSymbols] of byTarget.entries()) {
      // Determine which symbols on this (from, to) edge have been revealed up to the current step.
      const revealedSymbols = partial
        ? allSymbols.filter((sym) => partial.cells[from]?.[sym] === to)
        : allSymbols;

      const isHidden = partial ? revealedSymbols.length === 0 : false;
      const isHighlighted =
        partial !== null &&
        partial !== undefined &&
        partial.activeFrom === from &&
        partial.activeSymbol !== null &&
        allSymbols.includes(partial.activeSymbol);

      edges.push({
        id: `${from}->${to}`,
        from,
        to,
        label: (revealedSymbols.length > 0 ? revealedSymbols : allSymbols).join(','),
        hidden: isHidden,
        highlighted: isHighlighted,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Returns the NFA member states that should be highlighted in the NFA graph
 * during the current step (teaching highlight):
 * - On a transition step, returns the NFA states inside the DFA state being processed (`activeFrom`).
 * - On the start step, returns the NFA states inside the newly discovered start DFA state.
 */
export function activeNfaStates(dfa: DFA, partial?: PartialDfa | null): string[] {
  if (!partial) return [];
  const focusDfaState = partial.activeFrom ?? partial.newlyDiscovered;
  if (!focusDfaState) return [];
  return dfa.states.find((s) => s.name === focusDfaState)?.nfaStates ?? [];
}
