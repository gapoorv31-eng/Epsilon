// Input validation for the Mealy and Moore Conversion plugin.
import type { MealyMachine, MealyMooreInput, MooreMachine } from './types';

/**
 * Checks that a MealyMooreInput is complete and well-formed.
 * Returns a list of clear error messages; an empty list means valid.
 */
export function validateMealyMoore(input: MealyMooreInput): string[] {
  const errors: string[] = [];
  const { direction, machine, defaultStartOutput } = input;

  if (direction === 'mealy-to-moore' && machine.kind !== 'mealy') {
    errors.push('Direction "mealy-to-moore" requires a Mealy machine.');
    return errors;
  }
  if (direction === 'moore-to-mealy' && machine.kind !== 'moore') {
    errors.push('Direction "moore-to-mealy" requires a Moore machine.');
    return errors;
  }

  if (machine.states.length === 0) {
    errors.push('There must be at least one state.');
  }
  if (machine.inputAlphabet.length === 0) {
    errors.push('The input alphabet must not be empty.');
  }
  if (machine.outputAlphabet.length === 0) {
    errors.push('The output alphabet must not be empty.');
  }

  const stateSet = new Set(machine.states);
  const inputSet = new Set(machine.inputAlphabet);
  const outputSet = new Set(machine.outputAlphabet);

  if (!stateSet.has(machine.start)) {
    errors.push(`Start state '${machine.start}' is not in the list of states.`);
  }

  if (direction === 'mealy-to-moore' && defaultStartOutput !== undefined && defaultStartOutput !== '') {
    if (!outputSet.has(defaultStartOutput)) {
      errors.push(`Default start output '${defaultStartOutput}' is not in the output alphabet.`);
    }
  }

  if (machine.kind === 'mealy') {
    validateMealy(machine, stateSet, inputSet, outputSet, errors);
  } else {
    validateMoore(machine, stateSet, inputSet, outputSet, errors);
  }

  return errors;
}

/** Validates a Mealy machine's transitions and transition outputs. */
function validateMealy(
  machine: MealyMachine,
  stateSet: Set<string>,
  inputSet: Set<string>,
  outputSet: Set<string>,
  errors: string[]
): void {
  for (const from of Object.keys(machine.transitions)) {
    if (!stateSet.has(from)) {
      errors.push(`Transition from unknown state '${from}'.`);
      continue;
    }
    for (const sym of Object.keys(machine.transitions[from])) {
      if (!inputSet.has(sym)) {
        errors.push(`Transition from '${from}' uses unknown input symbol '${sym}'.`);
      }
    }
  }

  for (const state of machine.states) {
    const row = machine.transitions[state];
    for (const sym of machine.inputAlphabet) {
      const cell = row?.[sym];
      if (!cell || !cell.nextState) {
        errors.push(`Missing transition for (${state}, ${sym}).`);
        continue;
      }
      if (!stateSet.has(cell.nextState)) {
        errors.push(`Transition from '${state}' on '${sym}' goes to unknown state '${cell.nextState}'.`);
      }
      if (!cell.output) {
        errors.push(`Missing output for (${state}, ${sym}).`);
      } else if (!outputSet.has(cell.output)) {
        errors.push(`Output '${cell.output}' for (${state}, ${sym}) is not in the output alphabet.`);
      }
    }
  }
}

/** Validates a Moore machine's state outputs and complete transition table. */
function validateMoore(
  machine: MooreMachine,
  stateSet: Set<string>,
  inputSet: Set<string>,
  outputSet: Set<string>,
  errors: string[]
): void {
  for (const state of Object.keys(machine.outputs)) {
    if (!stateSet.has(state)) {
      errors.push(`Output defined for unknown state '${state}'.`);
    }
  }

  for (const state of machine.states) {
    const out = machine.outputs[state];
    if (!out) {
      errors.push(`Missing Moore output for state '${state}'.`);
    } else if (!outputSet.has(out)) {
      errors.push(`Moore output '${out}' for state '${state}' is not in the output alphabet.`);
    }
  }

  for (const from of Object.keys(machine.transitions)) {
    if (!stateSet.has(from)) {
      errors.push(`Transition from unknown state '${from}'.`);
      continue;
    }
    for (const sym of Object.keys(machine.transitions[from])) {
      if (!inputSet.has(sym)) {
        errors.push(`Transition from '${from}' uses unknown input symbol '${sym}'.`);
      }
    }
  }

  for (const state of machine.states) {
    const row = machine.transitions[state];
    for (const sym of machine.inputAlphabet) {
      const nextState = row?.[sym];
      if (!nextState) {
        errors.push(`Missing transition for (${state}, ${sym}).`);
      } else if (!stateSet.has(nextState)) {
        errors.push(`Transition from '${state}' on '${sym}' goes to unknown state '${nextState}'.`);
      }
    }
  }
}
