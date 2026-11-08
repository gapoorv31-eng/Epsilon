// Data types for the NFA -> DFA plugin.

/** The symbol used for epsilon (empty-string) moves. */
export const EPSILON = 'ε';

/** The name shown for the empty DFA state (the dead state). */
export const DEAD_STATE = '∅';

/**
 * A nondeterministic finite automaton.
 * transitions[state][symbol] is the list of states reachable in one move.
 * A missing entry means "no move". The symbol "ε" means an epsilon move.
 */
export interface NFA {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string[]>>;
  start: string;
  accepting: string[];
}

/** One DFA state: its display name and the set of NFA states it stands for. */
export interface DFAState {
  name: string;
  nfaStates: string[];
}

/**
 * A deterministic finite automaton.
 * transitions[state][symbol] is exactly ONE target state (the DFA is complete).
 */
export interface DFA {
  states: DFAState[];
  alphabet: string[];
  transitions: Record<string, Record<string, string>>;
  start: string;
  accepting: string[];
}
