import type { NFA } from './types';

/** Example NFA: accepts strings over {a,b} that end in "ab". */
export const endsInAbNfa: NFA = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  transitions: {
    q0: { a: ['q0', 'q1'], b: ['q0'] },
    q1: { b: ['q2'] },
  },
  start: 'q0',
  accepting: ['q2'],
};
