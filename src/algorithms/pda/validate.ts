// Input validation for the Pushdown Automaton Simulator plugin.
import { EPSILON, type PdaInput } from './types';

/**
 * Checks that a PDA and its input string are well-formed.
 * Returns a list of clear error messages; an empty list means valid.
 */
export function validatePda(input: PdaInput): string[] {
  const errors: string[] = [];
  const { machine, inputString } = input;

  if (machine.states.length === 0) {
    errors.push('There must be at least one state.');
  }
  if (machine.inputAlphabet.length === 0) {
    errors.push('The input alphabet must not be empty.');
  }
  if (machine.stackAlphabet.length === 0) {
    errors.push('The stack alphabet must not be empty.');
  }

  for (const sym of machine.inputAlphabet) {
    if (sym === EPSILON) {
      errors.push(`Input alphabet must not contain '${EPSILON}'; it is reserved for ε-moves.`);
    } else if ([...sym].length !== 1) {
      errors.push(`Input symbol '${sym}' must be a single character.`);
    }
  }

  for (const sym of machine.stackAlphabet) {
    if (sym === EPSILON) {
      errors.push(`Stack alphabet must not contain '${EPSILON}'.`);
    } else if ([...sym].length !== 1) {
      errors.push(`Stack symbol '${sym}' must be a single character.`);
    }
  }

  const stateSet = new Set(machine.states);
  const inputSet = new Set(machine.inputAlphabet);
  const stackSet = new Set(machine.stackAlphabet);

  if (!stateSet.has(machine.start)) {
    errors.push(`Start state '${machine.start}' is not in the list of states.`);
  }

  if (!stackSet.has(machine.initialStackSymbol)) {
    errors.push(`Initial stack symbol '${machine.initialStackSymbol}' is not in the stack alphabet.`);
  }

  for (const acc of machine.accepting) {
    if (!stateSet.has(acc)) {
      errors.push(`Accepting state '${acc}' is not in the list of states.`);
    }
  }

  for (const ch of inputString) {
    if (!inputSet.has(ch)) {
      errors.push(`Input string character '${ch}' is not in the input alphabet.`);
    }
  }

  machine.transitions.forEach((t, index) => {
    const label = `Transition #${index + 1}`;
    if (!stateSet.has(t.from)) {
      errors.push(`${label}: unknown 'from' state '${t.from}'.`);
    }
    if (!stateSet.has(t.to)) {
      errors.push(`${label}: unknown 'to' state '${t.to}'.`);
    }
    if (t.input !== EPSILON && !inputSet.has(t.input)) {
      errors.push(`${label}: input symbol '${t.input}' is not in the input alphabet (or '${EPSILON}').`);
    }
    if (!stackSet.has(t.top)) {
      errors.push(`${label}: stack top symbol '${t.top}' is not in the stack alphabet.`);
    }
    for (const ch of t.push) {
      if (!stackSet.has(ch)) {
        errors.push(`${label}: push symbol '${ch}' is not in the stack alphabet.`);
      }
    }
  });

  return errors;
}
