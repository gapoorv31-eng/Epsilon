// The NFA -> DFA plugin object. It glues validation and subset construction
// into the shared Algorithm interface so the registry and UI can use it.
import type { Algorithm } from '../types';
import { endsInAbNfa } from './example';
import { subsetConstruction } from './subsetConstruction';
import type { DFA, NFA } from './types';
import { validateNfa } from './validate';

export const nfaToDfa: Algorithm<NFA, DFA> = {
  id: 'nfa-to-dfa',
  name: 'NFA to DFA (Subset Construction)',
  description: 'Converts an NFA (with optional ε-moves) into an equivalent DFA.',
  exampleInput: endsInAbNfa,
  validate: validateNfa,
  run: subsetConstruction,
};

// Re-export helpers so tests and future UI code can import them from one place.
export { epsilonClosure, move, nfaAccepts } from './nfa';
export { dfaAccepts, setName } from './subsetConstruction';
export * from './types';
