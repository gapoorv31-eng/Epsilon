// Pure helper functions for the NFA form (no React), so they are easy to test.
import { EPSILON, type NFA } from '../../algorithms/nfaToDfa';

/**
 * Everything the user has typed into the NFA form, as raw text.
 * cells[state][symbol] is the text in one transition-table cell, e.g. "q0, q1".
 */
export interface NfaFormValues {
  states: string;
  alphabet: string;
  start: string;
  accepting: string;
  cells: Record<string, Record<string, string>>;
}

/** A completely empty form. */
export const emptyForm: NfaFormValues = { states: '', alphabet: '', start: '', accepting: '', cells: {} };

/**
 * Turns comma-separated text into a list: splits on commas, trims spaces,
 * and drops empty entries. Example: " q0, q1,, " -> ["q0", "q1"].
 */
export function parseList(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** The transition-table columns: every alphabet symbol, then one extra "ε" column. */
export function tableColumns(alphabet: string[]): string[] {
  return [...alphabet.filter((symbol) => symbol !== EPSILON), EPSILON];
}

/**
 * Builds an NFA object from the form text. Only cells for the CURRENT states
 * and columns are used; empty cells are skipped, which means "no move".
 */
export function buildNfa(form: NfaFormValues): NFA {
  const states = parseList(form.states);
  const alphabet = parseList(form.alphabet);
  const transitions: NFA['transitions'] = {};

  for (const state of states) {
    for (const symbol of tableColumns(alphabet)) {
      const targets = parseList(form.cells[state]?.[symbol] ?? '');
      if (targets.length > 0) {
        transitions[state] ??= {};
        transitions[state][symbol] = targets;
      }
    }
  }

  return { states, alphabet, transitions, start: form.start.trim(), accepting: parseList(form.accepting) };
}

/** The reverse of buildNfa: turns an NFA into form text (used by "Load example"). */
export function nfaToForm(nfa: NFA): NfaFormValues {
  const cells: NfaFormValues['cells'] = {};
  for (const [state, bySymbol] of Object.entries(nfa.transitions)) {
    cells[state] = {};
    for (const [symbol, targets] of Object.entries(bySymbol)) {
      cells[state][symbol] = targets.join(', ');
    }
  }
  return {
    states: nfa.states.join(', '),
    alphabet: nfa.alphabet.join(', '),
    start: nfa.start,
    accepting: nfa.accepting.join(', '),
    cells,
  };
}
