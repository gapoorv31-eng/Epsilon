// The Pushdown Automaton Simulator plugin object.
import type { Algorithm } from '../types';
import { examplePdaInput } from './example';
import { simulatePda } from './simulate';
import type { PdaInput, PdaResult } from './types';
import { validatePda } from './validate';

export const pda: Algorithm<PdaInput, PdaResult> = {
  id: 'pda',
  name: 'Pushdown Automaton Simulator',
  description: 'Simulates a deterministic or nondeterministic pushdown automaton (final-state or empty-stack).',
  exampleInput: examplePdaInput,
  validate: validatePda,
  run: simulatePda,
};

export { simulatePda } from './simulate';
export { validatePda } from './validate';
export * from './types';
