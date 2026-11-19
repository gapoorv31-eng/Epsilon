import { describe, expect, it } from 'vitest';
import {
  cfgAccepts,
  cfgToCnf,
  cykAccepts,
  isCnf,
  type CFG,
  type CfgStepData,
} from './index';

/** Generates all terminal strings (as symbol arrays) up to `maxLength`. */
function allWords(terminals: string[], maxLength: number): string[][] {
  let level: string[][] = [[]];
  const result: string[][] = [[]];
  for (let len = 1; len <= maxLength; len++) {
    level = level.flatMap((w) => terminals.map((t) => [...w, t]));
    result.push(...level);
  }
  return result;
}

/** Sorts each variable's alternatives so production sets can be compared regardless of list order. */
function sortedProds(prods: Record<string, string[][]>): Record<string, string[][]> {
  const out: Record<string, string[][]> = {};
  for (const [k, alts] of Object.entries(prods)) {
    out[k] = [...alts].sort((a, b) => a.join(' ').localeCompare(b.join(' ')));
  }
  return out;
}

/** Verifies CNF shape, 6-stage step metadata, and language equivalence up to length 5. */
function expectValidCnfConversion(original: CFG, cnf: CFG, stepsCount: number) {
  expect(stepsCount).toBe(6);
  expect(isCnf(cnf)).toBe(true);
  for (const word of allWords(original.terminals, 5)) {
    expect(cykAccepts(cnf, word)).toBe(cfgAccepts(original, word));
  }
}

describe('CFG to Chomsky Normal Form', () => {
  it('1. grammar with ε-productions removes nullable combinations and keeps S0 -> ε when ε ∈ L(G)', () => {
    const grammar: CFG = {
      variables: ['S', 'A', 'B'],
      terminals: ['a', 'b'],
      start: 'S',
      productions: {
        S: [['A', 'B']],
        A: [['a'], []],
        B: [['b'], []],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    expect(result.start).toBe('S0');
    expect(result.variables).toEqual(['S0', 'A', 'B']);
    expect(sortedProds(result.productions)).toEqual(
      sortedProds({
        S0: [['A', 'B'], ['a'], ['b'], []],
        A: [['a']],
        B: [['b']],
      })
    );
    expect(steps[1].description).toContain('Kept S0 -> ε');
  });

  it('2. unit-production chain collapses into direct terminal rules', () => {
    const grammar: CFG = {
      variables: ['S', 'A', 'B', 'C'],
      terminals: ['a'],
      start: 'S',
      productions: {
        S: [['A']],
        A: [['B']],
        B: [['C']],
        C: [['a']],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    expect(result).toEqual({
      variables: ['S0'],
      terminals: ['a'],
      start: 'S0',
      productions: {
        S0: [['a']],
      },
    });
  });

  it('3. useless symbols (non-generating and unreachable) are removed in stage 4', () => {
    const grammar: CFG = {
      variables: ['S', 'A', 'B', 'U'],
      terminals: ['a', 'b', 'u'],
      start: 'S',
      productions: {
        S: [['A'], ['B']],
        A: [['a']],
        B: [['B', 'b']],
        U: [['u']],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    const uselessData = steps[3].data as CfgStepData;
    expect(uselessData.stage).toBe('USELESS');
    expect(result).toEqual({
      variables: ['S0'],
      terminals: ['a'],
      start: 'S0',
      productions: {
        S0: [['a']],
      },
    });
  });

  it('4. long right-hand sides are isolated (TERM) and binarized (BIN)', () => {
    const grammar: CFG = {
      variables: ['S'],
      terminals: ['a', 'b', 'c', 'd'],
      start: 'S',
      productions: {
        S: [['a', 'b', 'c', 'd']],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    expect(result.variables).toEqual(['S0', 'X_a', 'X_b', 'X_c', 'X_d', 'Y1', 'Y2']);
    expect(result.productions).toEqual({
      S0: [['X_a', 'Y1']],
      Y1: [['X_b', 'Y2']],
      Y2: [['X_c', 'X_d']],
      X_a: [['a']],
      X_b: [['b']],
      X_c: [['c']],
      X_d: [['d']],
    });
  });

  it('5. grammar already in CNF stays unchanged apart from the new start symbol S0', () => {
    const grammar: CFG = {
      variables: ['S', 'A', 'B'],
      terminals: ['a', 'b'],
      start: 'S',
      productions: {
        S: [['A', 'B']],
        A: [['a']],
        B: [['b'], ['S', 'A']],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    expect(result.variables).toEqual(['S0', 'S', 'A', 'B']);
    expect(result.productions).toEqual({
      S0: [['A', 'B']],
      S: [['A', 'B']],
      A: [['a']],
      B: [['b'], ['S', 'A']],
    });
  });

  it('6. grammar generating ε (a^n b^n) keeps S0 -> ε and rejects ε on other variables', () => {
    const grammar: CFG = {
      variables: ['S'],
      terminals: ['a', 'b'],
      start: 'S',
      productions: {
        S: [['a', 'S', 'b'], []],
      },
    };

    const { steps, result } = cfgToCnf.run(grammar);
    expectValidCnfConversion(grammar, result, steps.length);

    expect(result.productions.S0).toContainEqual([]);
    expect(result.productions.S).not.toContainEqual([]);
    expect(cykAccepts(result, [])).toBe(true);
    expect(cykAccepts(result, ['a', 'b'])).toBe(true);
    expect(cykAccepts(result, ['a', 'a', 'b', 'b'])).toBe(true);
    expect(cykAccepts(result, ['a', 'b', 'b'])).toBe(false);
  });

  it('7. invalid grammars produce clear validation errors', () => {
    const emptyProds: CFG = {
      variables: ['S'],
      terminals: ['a'],
      start: 'S',
      productions: {},
    };
    expect(cfgToCnf.validate(emptyProds)).toContain('The production set must not be empty.');

    const badStart: CFG = {
      variables: ['S'],
      terminals: ['a'],
      start: 'X',
      productions: { S: [['a']] },
    };
    expect(cfgToCnf.validate(badStart)).toContain("Start symbol 'X' is not in the list of variables.");

    const unknownSym: CFG = {
      variables: ['S'],
      terminals: ['a'],
      start: 'S',
      productions: { S: [['a', 'Z']] },
    };
    expect(cfgToCnf.validate(unknownSym)).toContain(
      "Symbol 'Z' in production S -> a Z is neither a variable nor a terminal."
    );

    const epsInTerminals: CFG = {
      variables: ['S'],
      terminals: ['ε'],
      start: 'S',
      productions: { S: [[]] },
    };
    expect(cfgToCnf.validate(epsInTerminals)).toContain(
      "'ε' is reserved for the empty string and cannot be a terminal."
    );
  });

  it('8. classic example S -> ASB | ε, A -> aAS | a, B -> SbS | A | bb matches hand derivation', () => {
    const grammar = cfgToCnf.exampleInput;
    expect(cfgToCnf.validate(grammar)).toEqual([]);

    const { steps, result } = cfgToCnf.run(grammar);
    expect(steps.map((s) => (s.data as CfgStepData).stage)).toEqual([
      'START',
      'EPSILON',
      'UNIT',
      'USELESS',
      'TERM',
      'BIN',
    ]);

    // Check hand-derived final CNF grammar
    expect(result.start).toBe('S0');
    expect(result.variables).toEqual([
      'S0',
      'S',
      'A',
      'B',
      'X_a',
      'X_b',
      'Y1',
      'Y2',
      'Y3',
      'Y4',
      'Y5',
    ]);
    expect(result.terminals).toEqual(['a', 'b']);
    expect(sortedProds(result.productions)).toEqual(
      sortedProds({
        S0: [['A', 'Y1'], ['A', 'B'], []],
        S: [['A', 'Y2'], ['A', 'B']],
        A: [['X_a', 'Y3'], ['X_a', 'A'], ['a']],
        B: [
          ['S', 'Y4'],
          ['X_b', 'S'],
          ['S', 'X_b'],
          ['b'],
          ['X_b', 'X_b'],
          ['X_a', 'Y5'],
          ['X_a', 'A'],
          ['a'],
        ],
        X_a: [['a']],
        X_b: [['b']],
        Y1: [['S', 'B']],
        Y2: [['S', 'B']],
        Y3: [['A', 'S']],
        Y4: [['X_b', 'S']],
        Y5: [['A', 'S']],
      })
    );

    // Check CNF validity and language equivalence for all strings up to length 5
    expectValidCnfConversion(grammar, result, steps.length);
  });

  it('every step records before, after, added, and removed in CfgStepData', () => {
    const { steps } = cfgToCnf.run(cfgToCnf.exampleInput);
    for (const step of steps) {
      const data = step.data as CfgStepData;
      expect(data.before).toBeDefined();
      expect(data.after).toBeDefined();
      expect(Array.isArray(data.added)).toBe(true);
      expect(Array.isArray(data.removed)).toBe(true);
    }
  });
});
