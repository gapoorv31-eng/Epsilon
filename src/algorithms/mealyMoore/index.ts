// The Mealy and Moore Conversion plugin object.
import type { Algorithm } from '../types';
import { convertMealyMoore } from './convert';
import { exampleMealyMooreInput } from './example';
import type { MealyMooreInput, MealyMooreResult } from './types';
import { validateMealyMoore } from './validate';

export const mealyMoore: Algorithm<MealyMooreInput, MealyMooreResult> = {
  id: 'mealy-moore',
  name: 'Mealy and Moore Conversion',
  description: 'Converts between Mealy machines (output on transitions) and Moore machines (output on states).',
  exampleInput: exampleMealyMooreInput,
  validate: validateMealyMoore,
  run: convertMealyMoore,
};

export { convertMealyMoore, mealyToMoore, mooreToMealy } from './convert';
export { runTransducer, type TransducerRunResult } from './runMachine';
export { validateMealyMoore } from './validate';
export * from './types';
