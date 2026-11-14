import { describe, expect, it } from 'vitest';
import { runValidationCases, VALIDATION_CASES, type ValidationCase } from './validationCases';

describe('runValidationCases', () => {
  it('passes all 8 built-in validation cases', () => {
    const report = runValidationCases(VALIDATION_CASES);
    expect(report.totalCount).toBe(8);
    expect(report.passedCount).toBe(8);
    for (const res of report.results) {
      expect(res.passed, `${res.name}: ${res.actualText}`).toBe(true);
    }
  });

  it('compares state names and accepting sets independent of order', () => {
    const reorderedCase: ValidationCase = {
      ...VALIDATION_CASES[0],
      expectedStates: ['{q0,q2}', '{q0}', '{q0,q1}'],
    };
    const report = runValidationCases([reorderedCase]);
    expect(report.results[0].passed).toBe(true);
  });

  it('reports FAIL when an expectation is deliberately wrong', () => {
    const wrongStateCount: ValidationCase = {
      ...VALIDATION_CASES[0],
      expectedStateCount: 99,
    };
    const wrongAccepting: ValidationCase = {
      ...VALIDATION_CASES[0],
      expectedAccepting: ['{q0}'],
    };
    const wrongSample: ValidationCase = {
      ...VALIDATION_CASES[0],
      samples: [{ word: 'ab', accepted: false }],
    };

    const report = runValidationCases([wrongStateCount, wrongAccepting, wrongSample]);
    expect(report.passedCount).toBe(0);
    expect(report.results.every((r) => !r.passed)).toBe(true);
  });
});
