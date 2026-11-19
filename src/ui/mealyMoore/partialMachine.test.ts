import { describe, expect, it } from 'vitest';
import { mealyMoore, type MooreMachine } from '../../algorithms/mealyMoore';
import { buildPartialMachine } from './partialMachine';

describe('mealyMoore partialMachine', () => {
  it('progressively reveals states and transitions for Mealy -> Moore', () => {
    const { steps, result } = mealyMoore.run(mealyMoore.exampleInput);

    const step0 = buildPartialMachine(steps, 0, result);
    expect(step0.revealedStates).toEqual(['A/0']);
    expect(step0.newlyCreated).toBe('A/0');

    const last = buildPartialMachine(steps, steps.length - 1, result);
    expect(last.revealedStates).toEqual(['A/0', 'B/0', 'B/1']);
    expect(last.revealedCells['B/1']['1']).toEqual({ nextState: 'B/1' });
  });

  it('reveals one (state, symbol) cell per step for Moore -> Mealy', () => {
    const moore = mealyMoore.run(mealyMoore.exampleInput).result as MooreMachine;
    const { steps, result } = mealyMoore.run({ direction: 'moore-to-mealy', machine: moore });

    const step0 = buildPartialMachine(steps, 0, result);
    expect(step0.revealedStates).toEqual(['A/0', 'B/0', 'B/1']);
    expect(step0.activeFrom).toBe('A/0');
    expect(step0.activeSymbol).toBe('0');
    expect(step0.revealedCells['A/0']['0']).toEqual({ nextState: 'A/0', output: '0' });
    expect(step0.revealedCells['A/0']['1']).toBeUndefined();
  });
});
