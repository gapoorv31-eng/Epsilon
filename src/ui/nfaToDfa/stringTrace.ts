// Pure helper functions for tracing a string on an NFA and on a DFA.
// Reuses epsilonClosure, move, nfaAccepts, dfaAccepts, and setName from src/algorithms/nfaToDfa/.
import { dfaAccepts, epsilonClosure, move, nfaAccepts, setName, type DFA, type NFA } from '../../algorithms/nfaToDfa';

/** One row of the NFA string trace table. */
export interface NfaTraceRow {
  /** 0 for the start row (before reading any symbol), 1..n for each symbol read. */
  step: number;
  /** The symbol read at this step, or null for the start row. */
  symbol: string | null;
  /** The active NFA states after reading the symbol and taking ε-closure. */
  states: string[];
  /** Formatted set name, e.g. "{q0,q1}" or "∅". */
  stateLabel: string;
  /** True if at least one active NFA state in `states` is an accepting state. */
  hasAccepting: boolean;
}

/** Complete result of tracing a string on an NFA. */
export interface NfaTraceResult {
  /** Alphabet symbols that are longer than 1 character (if any, character-by-character testing cannot run). */
  multiCharAlphabetSymbols: string[];
  /** Characters in the input string that do not belong to the alphabet. */
  unknownSymbols: string[];
  /** Step-by-step rows (including row 0 for the initial ε-closure). Empty if validation failed. */
  rows: NfaTraceRow[];
  /** Whether the NFA accepts the string. */
  accepted: boolean;
}

/** One transition hop in the DFA string trace path. */
export interface DfaTraceHop {
  from: string;
  symbol: string;
  to: string;
}

/** Complete result of tracing a string on a DFA. */
export interface DfaTraceResult {
  /** Alphabet symbols that are longer than 1 character. */
  multiCharAlphabetSymbols: string[];
  /** Characters in the input string that do not belong to the alphabet. */
  unknownSymbols: string[];
  /** The DFA start state. */
  startState: string;
  /** Ordered sequence of hops taken for each character of the word. */
  hops: DfaTraceHop[];
  /** The DFA state reached after reading the entire word. */
  finalState: string;
  /** Whether the DFA accepts the string. */
  accepted: boolean;
}

/**
 * Returns any alphabet symbols whose length is not 1.
 * Because the string tester reads one character at a time, every alphabet symbol must be a single character.
 */
export function findMultiCharSymbols(alphabet: string[]): string[] {
  return alphabet.filter((symbol) => Array.from(symbol).length !== 1);
}

/**
 * Checks each character of `word` (without trimming spaces) and returns the list
 * of unique characters that are not present in `alphabet`, in order of appearance.
 */
export function findUnknownSymbols(alphabet: string[], word: string): string[] {
  const allowed = new Set(alphabet);
  const unknown: string[] = [];
  for (const ch of Array.from(word)) {
    if (!allowed.has(ch) && !unknown.includes(ch)) {
      unknown.push(ch);
    }
  }
  return unknown;
}

/**
 * Traces `word` character by character on `nfa`, reusing `epsilonClosure`, `move`,
 * `setName`, and `nfaAccepts` from the NFA->DFA plugin.
 */
export function traceNfa(nfa: NFA, word: string): NfaTraceResult {
  const multiCharAlphabetSymbols = findMultiCharSymbols(nfa.alphabet);
  if (multiCharAlphabetSymbols.length > 0) {
    return { multiCharAlphabetSymbols, unknownSymbols: [], rows: [], accepted: false };
  }

  const unknownSymbols = findUnknownSymbols(nfa.alphabet, word);
  if (unknownSymbols.length > 0) {
    return { multiCharAlphabetSymbols: [], unknownSymbols, rows: [], accepted: false };
  }

  const rows: NfaTraceRow[] = [];
  let current = epsilonClosure(nfa, [nfa.start]);
  rows.push({
    step: 0,
    symbol: null,
    states: current,
    stateLabel: setName(current),
    hasAccepting: current.some((s) => nfa.accepting.includes(s)),
  });

  const chars = Array.from(word);
  for (let i = 0; i < chars.length; i++) {
    const symbol = chars[i];
    current = epsilonClosure(nfa, move(nfa, current, symbol));
    rows.push({
      step: i + 1,
      symbol,
      states: current,
      stateLabel: setName(current),
      hasAccepting: current.some((s) => nfa.accepting.includes(s)),
    });
  }

  return {
    multiCharAlphabetSymbols: [],
    unknownSymbols: [],
    rows,
    accepted: nfaAccepts(nfa, word),
  };
}

/**
 * Traces `word` character by character on `dfa`, recording each state-to-state hop
 * and reusing `dfaAccepts` from the NFA->DFA plugin.
 */
export function traceDfa(dfa: DFA, word: string): DfaTraceResult {
  const multiCharAlphabetSymbols = findMultiCharSymbols(dfa.alphabet);
  if (multiCharAlphabetSymbols.length > 0) {
    return {
      multiCharAlphabetSymbols,
      unknownSymbols: [],
      startState: dfa.start,
      hops: [],
      finalState: dfa.start,
      accepted: false,
    };
  }

  const unknownSymbols = findUnknownSymbols(dfa.alphabet, word);
  if (unknownSymbols.length > 0) {
    return {
      multiCharAlphabetSymbols: [],
      unknownSymbols,
      startState: dfa.start,
      hops: [],
      finalState: dfa.start,
      accepted: false,
    };
  }

  const hops: DfaTraceHop[] = [];
  let current = dfa.start;
  for (const symbol of Array.from(word)) {
    const next = dfa.transitions[current]?.[symbol] ?? current;
    hops.push({ from: current, symbol, to: next });
    current = next;
  }

  return {
    multiCharAlphabetSymbols: [],
    unknownSymbols: [],
    startState: dfa.start,
    hops,
    finalState: current,
    accepted: dfaAccepts(dfa, word),
  };
}
