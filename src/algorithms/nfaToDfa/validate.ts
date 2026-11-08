// Input validation for the NFA -> DFA plugin.
import { EPSILON, type NFA } from './types';

/**
 * Checks that an NFA is well-formed. Returns a list of clear error
 * messages; an empty list means the NFA is valid.
 */
export function validateNfa(nfa: NFA): string[] {
  const errors: string[] = [];

  // An automaton needs at least one state and one input symbol.
  if (nfa.states.length === 0) {
    errors.push('There must be at least one state.');
  }
  if (nfa.alphabet.length === 0) {
    errors.push('The alphabet must not be empty.');
  }

  // "ε" is reserved for epsilon moves, so it cannot be an input letter.
  if (nfa.alphabet.includes(EPSILON)) {
    errors.push(`The alphabet must not contain '${EPSILON}'; it is reserved for epsilon moves.`);
  }

  // The start state and every accepting state must be real states.
  if (!nfa.states.includes(nfa.start)) {
    errors.push(`Start state '${nfa.start}' is not in the list of states.`);
  }
  for (const state of nfa.accepting) {
    if (!nfa.states.includes(state)) {
      errors.push(`Accepting state '${state}' is not in the list of states.`);
    }
  }

  // Every transition must go from a known state, on a known symbol (or ε), to known states.
  for (const [from, bySymbol] of Object.entries(nfa.transitions)) {
    if (!nfa.states.includes(from)) {
      errors.push(`Transition from unknown state '${from}'.`);
      continue;
    }
    for (const [symbol, targets] of Object.entries(bySymbol)) {
      if (symbol !== EPSILON && !nfa.alphabet.includes(symbol)) {
        errors.push(`Transition from '${from}' uses unknown symbol '${symbol}'.`);
      }
      for (const to of targets) {
        if (!nfa.states.includes(to)) {
          errors.push(`Transition from '${from}' on '${symbol}' goes to unknown state '${to}'.`);
        }
      }
    }
  }

  return errors;
}
