// Pure functions that convert Mealy and Moore machines into generic GraphData.
import type { MealyMachine, MooreMachine, TransducerMachine } from '../../algorithms/mealyMoore';
import type { GraphData, GraphEdge, GraphNode } from '../graph/types';
import type { PartialConvertedMachine } from './partialMachine';

/**
 * Converts a Mealy or Moore machine (with optional progressive partial state) into GraphData.
 * - Mealy edges are labelled "input/output" and parallel edges are merged (e.g. "0/0, 1/1").
 * - Moore nodes are labelled with the state name on line 1 and "out: <output>" on line 2.
 */
export function machineToGraph(
  machine: TransducerMachine,
  partial?: PartialConvertedMachine | null
): GraphData {
  if (machine.kind === 'mealy') {
    return mealyToGraph(machine, partial);
  }
  return mooreToGraph(machine, partial);
}

/** Builds GraphData for a Mealy machine. */
function mealyToGraph(mealy: MealyMachine, partial?: PartialConvertedMachine | null): GraphData {
  const revealedSet = partial ? new Set(partial.revealedStates) : null;

  const nodes: GraphNode[] = mealy.states.map((state) => ({
    id: state,
    label: state,
    start: state === mealy.start,
    hidden: revealedSet ? !revealedSet.has(state) : false,
    highlighted: partial ? partial.activeFrom === state : false,
    isNew: partial ? partial.newlyCreated === state : false,
  }));

  const edges: GraphEdge[] = [];
  for (const from of mealy.states) {
    const byTarget = new Map<string, { labels: string[]; symbols: string[] }>();

    for (const sym of mealy.inputAlphabet) {
      const cell = partial ? partial.revealedCells[from]?.[sym] : mealy.transitions[from]?.[sym];
      const target = cell?.nextState;
      const out = cell?.output;
      if (!target || out === undefined) continue;

      const entry = byTarget.get(target) ?? { labels: [], symbols: [] };
      entry.labels.push(`${sym}/${out}`);
      entry.symbols.push(sym);
      byTarget.set(target, entry);
    }

    for (const [to, { labels, symbols }] of byTarget.entries()) {
      const isHighlighted = Boolean(
        partial && partial.activeFrom === from && partial.activeSymbol && symbols.includes(partial.activeSymbol)
      );
      edges.push({
        id: `${from}->${to}`,
        from,
        to,
        label: labels.join(', '),
        highlighted: isHighlighted,
      });
    }
  }

  return { nodes, edges };
}

/** Builds GraphData for a Moore machine with two-line "name\nout: <output>" node labels. */
function mooreToGraph(moore: MooreMachine, partial?: PartialConvertedMachine | null): GraphData {
  const revealedSet = partial ? new Set(partial.revealedStates) : null;

  const nodes: GraphNode[] = moore.states.map((state) => ({
    id: state,
    label: `${state}\nout: ${moore.outputs[state]}`,
    start: state === moore.start,
    hidden: revealedSet ? !revealedSet.has(state) : false,
    highlighted: partial ? partial.activeFrom === state : false,
    isNew: partial ? partial.newlyCreated === state : false,
  }));

  const edges: GraphEdge[] = [];
  for (const from of moore.states) {
    const byTarget = new Map<string, string[]>();

    for (const sym of moore.inputAlphabet) {
      const target = partial
        ? partial.revealedCells[from]?.[sym]?.nextState
        : moore.transitions[from]?.[sym];
      if (!target) continue;

      const list = byTarget.get(target) ?? [];
      list.push(sym);
      byTarget.set(target, list);
    }

    for (const [to, symbols] of byTarget.entries()) {
      const isHighlighted = Boolean(
        partial && partial.activeFrom === from && partial.activeSymbol && symbols.includes(partial.activeSymbol)
      );
      edges.push({
        id: `${from}->${to}`,
        from,
        to,
        label: symbols.join(', '),
        highlighted: isHighlighted,
      });
    }
  }

  return { nodes, edges };
}
