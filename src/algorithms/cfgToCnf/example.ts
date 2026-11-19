// Built-in example CFG: the classic Sipser-style CFG -> CNF example.
import type { CFG } from './types';

/**
 * Classic example grammar:
 *   S -> A S B | ε
 *   A -> a A S | a
 *   B -> S b S | A | b b
 */
export const classicExampleCfg: CFG = {
  variables: ['S', 'A', 'B'],
  terminals: ['a', 'b'],
  start: 'S',
  productions: {
    S: [['A', 'S', 'B'], []],
    A: [['a', 'A', 'S'], ['a']],
    B: [['S', 'b', 'S'], ['A'], ['b', 'b']],
  },
};
