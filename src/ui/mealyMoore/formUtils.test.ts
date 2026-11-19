import { describe, expect, it } from 'vitest';
import { mealyMoore } from '../../algorithms/mealyMoore';
import {
  buildMealyMooreInput,
  emptyMealyMooreForm,
  inputToMealyMooreForm,
  parseList,
} from './formUtils';

describe('mealyMoore formUtils', () => {
  it('round-trips exampleInput through inputToMealyMooreForm and buildMealyMooreInput', () => {
    const form = inputToMealyMooreForm(mealyMoore.exampleInput);
    const rebuilt = buildMealyMooreInput(form);
    expect(rebuilt).toEqual(mealyMoore.exampleInput);
  });

  it('preserves hidden cell values when states or inputs are edited', () => {
    const form = inputToMealyMooreForm(mealyMoore.exampleInput);
    const withoutB = { ...form, states: 'A' };
    expect(withoutB.cells.B['1']).toEqual({ nextState: 'B', output: '1' });
    const restored = { ...withoutB, states: 'A, B' };
    expect(buildMealyMooreInput(restored)).toEqual(mealyMoore.exampleInput);
  });

  it('parses comma-separated lists without duplicates or empty items', () => {
    expect(parseList(' A, B , A, , C ')).toEqual(['A', 'B', 'C']);
    expect(emptyMealyMooreForm.direction).toBe('mealy-to-moore');
  });
});
