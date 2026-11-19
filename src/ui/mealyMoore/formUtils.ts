// Helper functions for the Mealy and Moore input form.
import type {
  ConversionDirection,
  MealyMachine,
  MealyMooreInput,
  MooreMachine,
} from '../../algorithms/mealyMoore';

export interface MealyCellValue {
  nextState: string;
  output: string;
}

export interface MealyMooreFormValues {
  direction: ConversionDirection;
  states: string;
  inputAlphabet: string;
  outputAlphabet: string;
  start: string;
  defaultStartOutput: string;
  /** cells[state][inputSymbol] -> { nextState, output } (output used in mealy mode). */
  cells: Record<string, Record<string, MealyCellValue>>;
  /** mooreOutputs[state] -> output symbol (used in moore mode). */
  mooreOutputs: Record<string, string>;
}

/** An empty Mealy/Moore form state. */
export const emptyMealyMooreForm: MealyMooreFormValues = {
  direction: 'mealy-to-moore',
  states: '',
  inputAlphabet: '',
  outputAlphabet: '',
  start: '',
  defaultStartOutput: '',
  cells: {},
  mooreOutputs: {},
};

/** Splits a comma-separated field into unique, trimmed, non-empty tokens. */
export function parseList(text: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of text.split(',')) {
    const trimmed = part.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      items.push(trimmed);
    }
  }
  return items;
}

/** Converts form text and cell values into a MealyMooreInput object. */
export function buildMealyMooreInput(form: MealyMooreFormValues): MealyMooreInput {
  const states = parseList(form.states);
  const inputAlphabet = parseList(form.inputAlphabet);
  const outputAlphabet = parseList(form.outputAlphabet);
  const start = form.start.trim();
  const defaultStartOutput = form.defaultStartOutput.trim();

  if (form.direction === 'mealy-to-moore') {
    const transitions: MealyMachine['transitions'] = {};
    for (const state of states) {
      transitions[state] = {};
      for (const sym of inputAlphabet) {
        const cell = form.cells[state]?.[sym];
        if (cell && (cell.nextState.trim() || cell.output.trim())) {
          transitions[state][sym] = {
            nextState: cell.nextState.trim(),
            output: cell.output.trim(),
          };
        }
      }
    }
    return {
      direction: 'mealy-to-moore',
      defaultStartOutput: defaultStartOutput || outputAlphabet[0] || '',
      machine: {
        kind: 'mealy',
        states,
        inputAlphabet,
        outputAlphabet,
        start,
        transitions,
      },
    };
  }

  const transitions: MooreMachine['transitions'] = {};
  const outputs: Record<string, string> = {};
  for (const state of states) {
    transitions[state] = {};
    for (const sym of inputAlphabet) {
      const next = form.cells[state]?.[sym]?.nextState.trim() ?? '';
      if (next) transitions[state][sym] = next;
    }
    const out = form.mooreOutputs[state]?.trim() ?? '';
    if (out) outputs[state] = out;
  }

  return {
    direction: 'moore-to-mealy',
    machine: {
      kind: 'moore',
      states,
      inputAlphabet,
      outputAlphabet,
      start,
      transitions,
      outputs,
    },
  };
}

/** Converts a MealyMooreInput object back into form state for "Load example". */
export function inputToMealyMooreForm(input: MealyMooreInput): MealyMooreFormValues {
  const { direction, machine, defaultStartOutput } = input;
  const cells: Record<string, Record<string, MealyCellValue>> = {};
  const mooreOutputs: Record<string, string> = {};

  for (const state of machine.states) {
    cells[state] = {};
    if (machine.kind === 'mealy') {
      for (const sym of machine.inputAlphabet) {
        const move = machine.transitions[state]?.[sym];
        if (move) {
          cells[state][sym] = { nextState: move.nextState, output: move.output };
        }
      }
    } else {
      mooreOutputs[state] = machine.outputs[state] ?? '';
      for (const sym of machine.inputAlphabet) {
        const next = machine.transitions[state]?.[sym];
        if (next) {
          cells[state][sym] = { nextState: next, output: '' };
        }
      }
    }
  }

  return {
    direction,
    states: machine.states.join(', '),
    inputAlphabet: machine.inputAlphabet.join(', '),
    outputAlphabet: machine.outputAlphabet.join(', '),
    start: machine.start,
    defaultStartOutput: defaultStartOutput ?? machine.outputAlphabet[0] ?? '',
    cells,
    mooreOutputs,
  };
}
