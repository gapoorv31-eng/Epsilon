// Basic NFA operations: ε-closure, move, and string acceptance.
import { EPSILON, type NFA } from './types';

/**
 * Returns the ε-closure of a set of NFA states: every state reachable
 * from the set using zero or more ε-moves (the set itself is always included).
 * If the NFA has no ε-moves, the set is returned unchanged.
 */
export function epsilonClosure(nfa: NFA, states: string[]): string[] {
  const closure = new Set<string>(states);
  const stack = [...states]; // states whose ε-moves we still need to follow

  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsilonTargets = nfa.transitions[state]?.[EPSILON] ?? [];
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target); // follow ε-moves from the new state too
      }
    }
  }
  return sortStates(nfa, closure);
}

/**
 * Returns move(states, symbol): the set of NFA states reachable from ANY
 * state in the set by reading `symbol` once. Missing transitions add nothing.
 */
export function move(nfa: NFA, states: string[], symbol: string): string[] {
  const result = new Set<string>();
  for (const state of states) {
    const targets = nfa.transitions[state]?.[symbol] ?? [];
    for (const target of targets) {
      result.add(target);
    }
  }
  return sortStates(nfa, result);
}

/**
 * Simulates the NFA on a word by tracking the SET of states it could be in.
 * Start in ε-closure({start}); for each letter, take move() then ε-closure.
 * The word is accepted if the final set contains an accepting state.
 */
export function nfaAccepts(nfa: NFA, word: string): boolean {
  let current = epsilonClosure(nfa, [nfa.start]);
  for (const letter of word) {
    current = epsilonClosure(nfa, move(nfa, current, letter));
  }
  return current.some((state) => nfa.accepting.includes(state));
}

/**
 * Puts a set of NFA states in the same order as nfa.states.
 * This gives every set ONE canonical form, so {q1,q0} and {q0,q1}
 * are recognised as the same DFA state.
 */
export function sortStates(nfa: NFA, states: Iterable<string>): string[] {
  const set = new Set(states);
  return nfa.states.filter((state) => set.has(state));
}
