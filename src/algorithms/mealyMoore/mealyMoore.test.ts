import { describe, expect, it } from 'vitest';
import {
  mealyMoore,
  runTransducer,
  type MealyMachine,
  type MealyMooreInput,
  type MooreMachine,
  type TransducerMachine,
} from './index';

/** Generates all input symbol sequences over `alphabet` up to `maxLength`. */
function allWords(alphabet: string[], maxLength: number): string[][] {
  let level: string[][] = [[]];
  const result: string[][] = [[]];
  for (let len = 1; len <= maxLength; len++) {
    level = level.flatMap((w) => alphabet.map((s) => [...w, s]));
    result.push(...level);
  }
  return result;
}

/** Verifies two transducers produce identical output sequences on all inputs up to length 6. */
function expectEquivalent(a: TransducerMachine, b: TransducerMachine, maxLength = 6) {
  for (const word of allWords(a.inputAlphabet, maxLength)) {
    const resA = runTransducer(a, word);
    const resB = runTransducer(b, word);
    expect(resA.outputs).toEqual(resB.outputs);
  }
}

describe('Mealy and Moore Conversion', () => {
  it('1. converts the required Mealy example into the 3-state Moore machine', () => {
    const input = mealyMoore.exampleInput;
    expect(mealyMoore.validate(input)).toEqual([]);

    const { steps, result } = mealyMoore.run(input);
    const moore = result as MooreMachine;

    expect(moore).toEqual({
      kind: 'moore',
      states: ['A/0', 'B/0', 'B/1'],
      inputAlphabet: ['0', '1'],
      outputAlphabet: ['0', '1'],
      start: 'A/0',
      outputs: { 'A/0': '0', 'B/0': '0', 'B/1': '1' },
      transitions: {
        'A/0': { '0': 'A/0', '1': 'B/0' },
        'B/0': { '0': 'A/0', '1': 'B/1' },
        'B/1': { '0': 'A/0', '1': 'B/1' },
      },
    });
    // 3 created states + 6 transitions = 9 steps
    expect(steps.length).toBe(9);
    expectEquivalent(input.machine, moore);
  });

  it('2. converts the 3-state Moore result back to an equivalent Mealy machine in exactly |Q|*|Σ| steps', () => {
    const mooreResult = mealyMoore.run(mealyMoore.exampleInput).result as MooreMachine;
    const reverseInput: MealyMooreInput = {
      direction: 'moore-to-mealy',
      machine: mooreResult,
    };
    expect(mealyMoore.validate(reverseInput)).toEqual([]);

    const { steps, result } = mealyMoore.run(reverseInput);
    const mealy = result as MealyMachine;

    expect(steps.length).toBe(mooreResult.states.length * mooreResult.inputAlphabet.length);
    expect(steps[0].description).toContain('no Mealy equivalent');

    expect(mealy).toEqual({
      kind: 'mealy',
      states: ['A/0', 'B/0', 'B/1'],
      inputAlphabet: ['0', '1'],
      outputAlphabet: ['0', '1'],
      start: 'A/0',
      transitions: {
        'A/0': {
          '0': { nextState: 'A/0', output: '0' },
          '1': { nextState: 'B/0', output: '0' },
        },
        'B/0': {
          '0': { nextState: 'A/0', output: '0' },
          '1': { nextState: 'B/1', output: '1' },
        },
        'B/1': {
          '0': { nextState: 'A/0', output: '0' },
          '1': { nextState: 'B/1', output: '1' },
        },
      },
    });

    expectEquivalent(mooreResult, mealy);
    expectEquivalent(mealyMoore.exampleInput.machine, mealy);
  });

  it('3. produces no state splitting when each state receives only one output (with defaultStartOutput="0")', () => {
    const input: MealyMooreInput = {
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
            '1': { nextState: 'B', output: '1' },
          },
          B: {
            '0': { nextState: 'A', output: '0' },
            '1': { nextState: 'B', output: '1' },
          },
        },
      },
    };

    const moore = mealyMoore.run(input).result as MooreMachine;
    expect(moore.states).toEqual(['A/0', 'B/1']);
    expect(moore.outputs).toEqual({ 'A/0': '0', 'B/1': '1' });
    expectEquivalent(input.machine, moore);
  });

  it('4. creates an extra Moore start state when defaultStartOutput differs from the output entering start', () => {
    // Even though every transition into A emits '0', choosing defaultStartOutput='1' forces
    // the start state to be (A, 1), so (A, 0) must also be created as a separate Moore state.
    const input: MealyMooreInput = {
      direction: 'mealy-to-moore',
      defaultStartOutput: '1',
      machine: {
        kind: 'mealy',
        states: ['A', 'B'],
        inputAlphabet: ['0', '1'],
        outputAlphabet: ['0', '1'],
        start: 'A',
        transitions: {
          A: {
            '0': { nextState: 'A', output: '0' },
            '1': { nextState: 'B', output: '1' },
          },
          B: {
            '0': { nextState: 'A', output: '0' },
            '1': { nextState: 'B', output: '1' },
          },
        },
      },
    };

    const moore = mealyMoore.run(input).result as MooreMachine;
    expect(moore.start).toBe('A/1');
    expect(moore.states).toEqual(['A/1', 'A/0', 'B/1']);
    expect(moore.outputs).toEqual({ 'A/1': '1', 'A/0': '0', 'B/1': '1' });
    expectEquivalent(input.machine, moore);
  });

  it('5. omits unreachable states during Mealy -> Moore BFS', () => {
    const input: MealyMooreInput = {
      direction: 'mealy-to-moore',
      defaultStartOutput: '0',
      machine: {
        kind: 'mealy',
        states: ['A', 'B', 'C'],
        inputAlphabet: ['0', '1'],
        outputAlphabet: ['0', '1'],
        start: 'A',
        transitions: {
          A: { '0': { nextState: 'A', output: '0' }, '1': { nextState: 'B', output: '1' } },
          B: { '0': { nextState: 'A', output: '0' }, '1': { nextState: 'B', output: '1' } },
          C: { '0': { nextState: 'C', output: '1' }, '1': { nextState: 'C', output: '0' } },
        },
      },
    };

    const moore = mealyMoore.run(input).result as MooreMachine;
    expect(moore.states).toEqual(['A/0', 'B/1']);
    expect(moore.states.some((s) => s.startsWith('C/'))).toBe(false);
    expectEquivalent(input.machine, moore);
  });

  it('6. handles 3 or more output symbols with custom defaultStartOutput', () => {
    const input: MealyMooreInput = {
      direction: 'mealy-to-moore',
      defaultStartOutput: 'z',
      machine: {
        kind: 'mealy',
        states: ['q0', 'q1'],
        inputAlphabet: ['a', 'b'],
        outputAlphabet: ['x', 'y', 'z'],
        start: 'q0',
        transitions: {
          q0: { a: { nextState: 'q1', output: 'x' }, b: { nextState: 'q0', output: 'y' } },
          q1: { a: { nextState: 'q0', output: 'z' }, b: { nextState: 'q1', output: 'x' } },
        },
      },
    };

    expect(mealyMoore.validate(input)).toEqual([]);
    const moore = mealyMoore.run(input).result as MooreMachine;
    expect(moore.start).toBe('q0/z');
    expect(moore.states).toEqual(['q0/z', 'q1/x', 'q0/y']);
    expectEquivalent(input.machine, moore);
  });

  it('7. rejects invalid machines with clear error messages', () => {
    const badInput: MealyMooreInput = {
      direction: 'mealy-to-moore',
      defaultStartOutput: '9',
      machine: {
        kind: 'mealy',
        states: ['A'],
        inputAlphabet: ['0'],
        outputAlphabet: ['0', '1'],
        start: 'Z',
        transitions: {
          A: { '0': { nextState: 'A', output: '2' } },
        },
      },
    };

    const errors = mealyMoore.validate(badInput);
    expect(errors).toContain("Start state 'Z' is not in the list of states.");
    expect(errors).toContain("Default start output '9' is not in the output alphabet.");
    expect(errors).toContain("Output '2' for (A, 0) is not in the output alphabet.");
  });

  it('8. rejects missing transitions in both Mealy and Moore machines', () => {
    const incompleteMealy: MealyMooreInput = {
      direction: 'mealy-to-moore',
      machine: {
        kind: 'mealy',
        states: ['A', 'B'],
        inputAlphabet: ['0', '1'],
        outputAlphabet: ['0'],
        start: 'A',
        transitions: {
          A: { '0': { nextState: 'B', output: '0' } },
          B: { '0': { nextState: 'A', output: '0' }, '1': { nextState: 'B', output: '0' } },
        },
      },
    };
    expect(mealyMoore.validate(incompleteMealy)).toContain('Missing transition for (A, 1).');

    const incompleteMoore: MealyMooreInput = {
      direction: 'moore-to-mealy',
      machine: {
        kind: 'moore',
        states: ['A'],
        inputAlphabet: ['0', '1'],
        outputAlphabet: ['0'],
        start: 'A',
        outputs: { A: '0' },
        transitions: { A: { '0': 'A' } },
      },
    };
    expect(mealyMoore.validate(incompleteMoore)).toContain('Missing transition for (A, 1).');
  });

  it('9. avoids key collisions when user state names contain "/" or ","', () => {
    const input: MealyMooreInput = {
      direction: 'mealy-to-moore',
      defaultStartOutput: '0',
      machine: {
        kind: 'mealy',
        states: ['A/0', 'A', 'B,1'],
        inputAlphabet: ['a', 'b'],
        outputAlphabet: ['0', '0/0'],
        start: 'A/0',
        transitions: {
          'A/0': {
            a: { nextState: 'A', output: '0/0' },
            b: { nextState: 'B,1', output: '0' },
          },
          A: {
            a: { nextState: 'A/0', output: '0' },
            b: { nextState: 'B,1', output: '0/0' },
          },
          'B,1': {
            a: { nextState: 'A/0', output: '0' },
            b: { nextState: 'A', output: '0/0' },
          },
        },
      },
    };

    expect(mealyMoore.validate(input)).toEqual([]);
    const moore = mealyMoore.run(input).result as MooreMachine;
    // ('A/0', '0') and ('A', '0/0') both format to "A/0/0", so they must remain distinct states.
    expect(new Set(moore.states).size).toBe(moore.states.length);
    expect(moore.states.length).toBe(4);
    expectEquivalent(input.machine, moore);
  });

  it('10. runTransducer returns Moore fullOutputs with start output and outputs without it', () => {
    const moore = mealyMoore.run(mealyMoore.exampleInput).result as MooreMachine;
    const res = runTransducer(moore, ['1', '1', '0']);
    expect(res.outputs).toEqual(['0', '1', '0']);
    expect(res.fullOutputs).toEqual(['0', '0', '1', '0']);
  });
});
