// Subset construction: converts an NFA into an equivalent DFA, recording steps.
import type { RunResult, Step } from '../types';
import { epsilonClosure, move } from './nfa';
import { DEAD_STATE, type DFA, type DFAState, type NFA } from './types';

/**
 * Gives a set of NFA states its DFA-state name, e.g. ["q0","q1"] -> "{q0,q1}".
 * The empty set is the dead state "∅".
 */
export function setName(states: string[]): string {
  return states.length === 0 ? DEAD_STATE : `{${states.join(',')}}`;
}

/**
 * Converts an NFA to a DFA using subset construction with a BFS queue.
 * Each DFA state is a SET of NFA states. Only reachable DFA states are built.
 * Assumes the NFA has already passed validateNfa().
 */
export function subsetConstruction(nfa: NFA): RunResult<DFA> {
  const steps: Step[] = [];
  const dfaStates: DFAState[] = [];                          // in discovery order
  const transitions: Record<string, Record<string, string>> = {};
  const seen = new Set<string>();                            // names of DFA states found so far
  const queue: string[][] = [];                              // DFA states still to process

  // 1. The DFA start state is the ε-closure of the NFA start state.
  const startSet = epsilonClosure(nfa, [nfa.start]);
  const startName = setName(startSet);
  seen.add(startName);
  dfaStates.push({ name: startName, nfaStates: startSet });
  queue.push(startSet);
  steps.push({
    title: `Start state = ε-closure({${nfa.start}}) = ${startName}`,
    description:
      `The DFA starts in every NFA state reachable from ${nfa.start} using only ε-moves. ` +
      `This set, ${startName}, becomes the DFA start state.`,
    data: { from: null, symbol: null, moveResult: [nfa.start], to: startName, isNew: true },
  });

  // 2. BFS: take a DFA state from the front of the queue and compute its move on every symbol.
  while (queue.length > 0) {
    const currentSet = queue.shift()!;
    const currentName = setName(currentSet);
    transitions[currentName] = {};

    for (const symbol of nfa.alphabet) {
      // Where can the NFA go on this symbol, then with ε-moves afterwards?
      const moveResult = move(nfa, currentSet, symbol);
      const targetSet = epsilonClosure(nfa, moveResult);
      const targetName = setName(targetSet);

      // If this set has never been seen, it is a new DFA state: remember it and queue it.
      const isNew = !seen.has(targetName);
      if (isNew) {
        seen.add(targetName);
        dfaStates.push({ name: targetName, nfaStates: targetSet });
        queue.push(targetSet);
      }

      // The DFA has exactly one transition for this (state, symbol) pair.
      transitions[currentName][symbol] = targetName;

      steps.push({
        title: `δ(${currentName}, ${symbol}) = ${targetName}`,
        description:
          `From ${currentName} on '${symbol}' the NFA can reach ${setName(moveResult)}. ` +
          `Adding ε-moves gives ${targetName}. ` +
          (isNew ? `This is a NEW DFA state, so it is added to the queue.` : `This DFA state already exists.`),
        data: { from: currentName, symbol, moveResult, to: targetName, isNew },
      });
    }
  }

  // 3. A DFA state is accepting if it contains at least one NFA accepting state.
  const accepting = dfaStates
    .filter((state) => state.nfaStates.some((s) => nfa.accepting.includes(s)))
    .map((state) => state.name);

  const dfa: DFA = {
    states: dfaStates,
    alphabet: [...nfa.alphabet],
    transitions,
    start: startName,
    accepting,
  };
  return { steps, result: dfa };
}

/**
 * Runs the DFA on a word: from the start state, follow exactly one transition
 * per letter. The word is accepted if we end in an accepting state.
 * A letter not in the alphabet rejects the word.
 */
export function dfaAccepts(dfa: DFA, word: string): boolean {
  let current = dfa.start;
  for (const letter of word) {
    const next = dfa.transitions[current]?.[letter];
    if (next === undefined) return false;
    current = next;
  }
  return dfa.accepting.includes(current);
}
