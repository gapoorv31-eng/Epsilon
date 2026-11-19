// Built-in example for the Mealy and Moore Conversion plugin.
import type { MealyMooreInput } from './types';

/**
 * Classic Mealy machine with 2 states (A start, B), inputs {0, 1}, outputs {0, 1}:
 *   A -0-> A / 0,  A -1-> B / 0
 *   B -0-> A / 0,  B -1-> B / 1
 */
export const exampleMealyMooreInput: MealyMooreInput = {
  direction: 'mealy-to-moore',
  defaultStartOutput: '0',
  machine: {
    kind: 'mealy',
    states: ['A', 'B'],
    inputAlphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    start: 'A',
    transitions: {
      A: {
        '0': { nextState: 'A', output: '0' },
        '1': { nextState: 'B', output: '0' },
      },
      B: {
        '0': { nextState: 'A', output: '0' },
        '1': { nextState: 'B', output: '1' },
      },
    },
  },
};
