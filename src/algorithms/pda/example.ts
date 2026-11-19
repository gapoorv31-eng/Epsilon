// Built-in example PDA for { a^n b^n : n >= 0 } with final-state acceptance.
import { EPSILON, type PdaInput } from './types';

/**
 * Classic PDA accepting { a^n b^n : n >= 0 } by final state, with example input "aabb".
 */
export const examplePdaInput: PdaInput = {
  inputString: 'aabb',
  machine: {
    states: ['q0', 'q1', 'q2'],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z', 'A'],
    start: 'q0',
    initialStackSymbol: 'Z',
    accepting: ['q2'],
    acceptanceMode: 'final-state',
    transitions: [
      { from: 'q0', input: 'a', top: 'Z', to: 'q0', push: 'AZ' },
      { from: 'q0', input: 'a', top: 'A', to: 'q0', push: 'AA' },
      { from: 'q0', input: 'b', top: 'A', to: 'q1', push: '' },
      { from: 'q1', input: 'b', top: 'A', to: 'q1', push: '' },
      { from: 'q1', input: EPSILON, top: 'Z', to: 'q2', push: 'Z' },
      { from: 'q0', input: EPSILON, top: 'Z', to: 'q2', push: 'Z' },
    ],
  },
};
