// Pure UI helpers for progressive NFA -> DFA table construction and plain-English step descriptions.
import type { Step } from '../../algorithms/types';
import { DEAD_STATE, setName, type DFA, type DFAState, type NFA } from '../../algorithms/nfaToDfa';

/**
 * The exact shape of `step.data` produced by subsetConstruction() in src/algorithms/nfaToDfa/subsetConstruction.ts:
 * - Start step (index 0): { from: null, symbol: null, moveResult: [nfa.start], to: startName, isNew: true }
 * - Transition steps (index >= 1): { from: currentName, symbol, moveResult, to: targetName, isNew }
 */
interface NfaStepData {
  from: string | null;
  symbol: string | null;
  moveResult: string[];
  to: string;
  isNew: boolean;
}

/**
 * The slice of the DFA transition table revealed up to `currentStep`.
 */
export interface PartialDfa {
  /** DFA states discovered in steps[0 .. currentStep], in discovery order. */
  states: DFAState[];
  /** Revealed transitions: cells[dfaStateName][symbol] = targetName. Unreached cells are undefined. */
  cells: Record<string, Record<string, string>>;
  /** The DFA state row being processed in `steps[currentStep]` (null on the start step). */
  activeFrom: string | null;
  /** The input symbol column being processed in `steps[currentStep]` (null on the start step). */
  activeSymbol: string | null;
  /** If `steps[currentStep]` discovered a brand-new DFA state, its name; otherwise null. */
  newlyDiscovered: string | null;
}

/**
 * Builds the partial DFA table revealed by `steps[0 .. currentStep]`.
 * Discovered state names and transitions are derived strictly from the steps (`from`, `symbol`, `to`, `isNew`).
 * Each discovered state's `nfaStates` list is looked up from `fullDfa.states` (empty for the dead state ∅).
 */
export function buildPartialDfa(steps: Step[], currentStep: number, fullDfa: DFA): PartialDfa {
  const stateByName = new Map<string, DFAState>(fullDfa.states.map((s) => [s.name, s]));
  const discoveredNames: string[] = [];
  const seen = new Set<string>();
  const cells: Record<string, Record<string, string>> = {};

  const lastIndex = Math.min(Math.max(0, currentStep), steps.length - 1);

  for (let i = 0; i <= lastIndex; i++) {
    const data = steps[i].data as unknown as NfaStepData;

    // If a step discovers a state for the first time, add it to the revealed rows.
    if (data.isNew && !seen.has(data.to)) {
      seen.add(data.to);
      discoveredNames.push(data.to);
      cells[data.to] = {};
    }

    // Transition steps have non-null `from` and `symbol` and fill exactly one cell.
    if (data.from !== null && data.symbol !== null) {
      cells[data.from] ??= {};
      cells[data.from][data.symbol] = data.to;
    }
  }

  // Look up each discovered DFA state in fullDfa.states (for ∅, nfaStates is []).
  const states: DFAState[] = discoveredNames.map(
    (name) => stateByName.get(name) ?? { name, nfaStates: [] },
  );

  const currentData = (steps[lastIndex]?.data as unknown as NfaStepData | undefined) ?? null;

  return {
    states,
    cells,
    activeFrom: currentData ? currentData.from : null,
    activeSymbol: currentData ? currentData.symbol : null,
    newlyDiscovered: currentData && currentData.isNew ? currentData.to : null,
  };
}

/**
 * Rewrites the steps of subset construction with friendly, plain-English descriptions
 * that explain how each NFA state moves, without modifying src/algorithms/.
 */
export function formatNfaSteps(nfa: NFA, steps: Step[], fullDfa: DFA): Step[] {
  const nfaStatesByName = new Map<string, string[]>(fullDfa.states.map((s) => [s.name, s.nfaStates]));

  return steps.map((step) => {
    const data = step.data as unknown as NfaStepData;

    // 1. Start step: explain how the initial DFA state is formed from nfa.start.
    if (data.from === null || data.symbol === null) {
      const startState = data.moveResult[0] ?? nfa.start;
      const singleName = setName([startState]);
      if (data.to === singleName) {
        return {
          ...step,
          description:
            `Start at NFA state ${startState}. No ε-moves leave ${startState}, so the starting DFA state is ${data.to}. ` +
            `It is new, so it joins the queue.`,
        };
      }
      return {
        ...step,
        description:
          `Start at NFA state ${startState} and follow ε-moves to reach ${data.to}. ` +
          `This set becomes the starting DFA state and joins the queue.`,
      };
    }

    // 2. Transition step: look up the NFA states inside `data.from` from fullDfa.states.
    const sourceNfaStates = nfaStatesByName.get(data.from) ?? [];
    const perStateParts = sourceNfaStates.map((s) => {
      const targets = nfa.transitions[s]?.[data.symbol!] ?? [];
      return `${s} goes to ${setName(targets)}`;
    });

    const moveName = setName(data.moveResult);
    const breakdown =
      sourceNfaStates.length > 0
        ? `From ${data.from}, reading '${data.symbol}': ${perStateParts.join(' and ')}, so the union is ${moveName}.`
        : `From the dead state ${DEAD_STATE}, reading '${data.symbol}' stays at ${DEAD_STATE}.`;

    const epsilonNote =
      moveName !== data.to ? ` Following ε-moves expands ${moveName} to ${data.to}.` : '';

    const queueNote = data.isNew
      ? data.to === DEAD_STATE
        ? ` This introduces the dead state ${DEAD_STATE}, which joins the queue.`
        : ` It is new, so it joins the queue.`
      : ` This DFA state was already found.`;

    return {
      ...step,
      description: `${breakdown}${epsilonNote}${queueNote}`,
    };
  });
}
