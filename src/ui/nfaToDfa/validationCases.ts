// Built-in validation test cases and pure runner for the NFA -> DFA plugin.
// All expected state counts, state names, accepting sets, and sample answers are
// hand-written constants so the validation suite genuinely tests the algorithm.
// Note: NFA state names inside each DFA state brace (e.g. "{s,a1,a2,b2}") follow
// the order of `nfa.states`, while lists of DFA state names and accepting states
// are compared as sets (order does not matter).
import { dfaAccepts, nfaAccepts, nfaToDfa, type NFA } from '../../algorithms/nfaToDfa';

/** One sample string and whether it should be accepted. */
export interface ValidationSample {
  word: string;
  accepted: boolean;
}

/** One built-in validation test case. */
export interface ValidationCase {
  name: string;
  description: string;
  nfa: NFA;
  expectedStateCount: number;
  expectedStates: string[];
  expectedAccepting: string[];
  samples: ValidationSample[];
}

/** Result of running a single validation case. */
export interface ValidationCaseResult {
  name: string;
  description: string;
  expectedText: string;
  actualText: string;
  passed: boolean;
}

/** Overall summary of running all validation cases. */
export interface ValidationReport {
  results: ValidationCaseResult[];
  passedCount: number;
  totalCount: number;
}

/**
 * Built-in list of 8 validation cases covering all required NFA scenarios.
 * Every expected value is written by hand.
 * Inside each DFA state name `{...}`, member NFA states appear in the order of `nfa.states`.
 */
export const VALIDATION_CASES: ValidationCase[] = [
  {
    name: '1. Strings ending in "ab"',
    description: 'Standard 3-state NFA over {a,b} that accepts words ending in "ab".',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: {
        q0: { a: ['q0', 'q1'], b: ['q0'] },
        q1: { b: ['q2'] },
      },
      start: 'q0',
      accepting: ['q2'],
    },
    expectedStateCount: 3,
    expectedStates: ['{q0}', '{q0,q1}', '{q0,q2}'],
    expectedAccepting: ['{q0,q2}'],
    samples: [
      { word: 'ab', accepted: true },
      { word: 'aab', accepted: true },
      { word: 'aba', accepted: false },
      { word: '', accepted: false },
    ],
  },
  {
    name: '2. Missing transitions (dead state ∅)',
    description: 'NFA with missing moves that reaches the dead state ∅ and loops there.',
    nfa: {
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      transitions: {
        q0: { a: ['q1'] },
      },
      start: 'q0',
      accepting: ['q1'],
    },
    expectedStateCount: 3,
    expectedStates: ['{q0}', '{q1}', '∅'],
    expectedAccepting: ['{q1}'],
    samples: [
      { word: 'a', accepted: true },
      { word: 'b', accepted: false },
      { word: 'ab', accepted: false },
    ],
  },
  {
    name: '3. Start state also accepting',
    description: 'Even number of a’s: start state s0 is accepting, so ε is accepted.',
    nfa: {
      states: ['s0', 's1'],
      alphabet: ['a'],
      transitions: {
        s0: { a: ['s1'] },
        s1: { a: ['s0'] },
      },
      start: 's0',
      accepting: ['s0'],
    },
    expectedStateCount: 2,
    expectedStates: ['{s0}', '{s1}'],
    expectedAccepting: ['{s0}'],
    samples: [
      { word: '', accepted: true },
      { word: 'aa', accepted: true },
      { word: 'a', accepted: false },
    ],
  },
  {
    name: '4. No accepting states',
    description: 'NFA with an empty accepting set: resulting DFA rejects every string.',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: {
        q0: { a: ['q0', 'q1'], b: ['q0'] },
        q1: { b: ['q2'] },
      },
      start: 'q0',
      accepting: [],
    },
    expectedStateCount: 3,
    expectedStates: ['{q0}', '{q0,q1}', '{q0,q2}'],
    expectedAccepting: [],
    samples: [
      { word: '', accepted: false },
      { word: 'ab', accepted: false },
      { word: 'aab', accepted: false },
    ],
  },
  {
    name: '5. Unreachable NFA state',
    description: 'NFA state q2 has no incoming path from start q0 and never appears in the DFA.',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: {
        q0: { a: ['q0'], b: ['q1'] },
        q2: { a: ['q1'] },
      },
      start: 'q0',
      accepting: ['q1'],
    },
    expectedStateCount: 3,
    expectedStates: ['{q0}', '{q1}', '∅'],
    expectedAccepting: ['{q1}'],
    samples: [
      { word: 'b', accepted: true },
      { word: 'aab', accepted: true },
      { word: 'ba', accepted: false },
    ],
  },
  {
    name: '6. Multi-path NFA ("contains aa or bb")',
    description: 'Nondeterministic guessing along two branches (a1->a2 and b1->b2) with sink states a2, b2.',
    nfa: {
      states: ['s', 'a1', 'a2', 'b1', 'b2'],
      alphabet: ['a', 'b'],
      transitions: {
        s: { a: ['s', 'a1'], b: ['s', 'b1'] },
        a1: { a: ['a2'] },
        b1: { b: ['b2'] },
        a2: { a: ['a2'], b: ['a2'] },
        b2: { a: ['b2'], b: ['b2'] },
      },
      start: 's',
      accepting: ['a2', 'b2'],
    },
    expectedStateCount: 9,
    // Inside braces, NFA state names follow nfa.states order: ['s', 'a1', 'a2', 'b1', 'b2'].
    expectedStates: [
      '{s}',
      '{s,a1}',
      '{s,b1}',
      '{s,a1,a2}',
      '{s,b1,b2}',
      '{s,a2,b1}',
      '{s,a1,b2}',
      '{s,a2,b1,b2}',
      '{s,a1,a2,b2}',
    ],
    expectedAccepting: [
      '{s,a1,a2}',
      '{s,b1,b2}',
      '{s,a2,b1}',
      '{s,a1,b2}',
      '{s,a2,b1,b2}',
      '{s,a1,a2,b2}',
    ],
    samples: [
      { word: 'aa', accepted: true },
      { word: 'bb', accepted: true },
      { word: 'abba', accepted: true },
      { word: 'abab', accepted: false },
    ],
  },
  {
    name: '7. ε-NFA (a*b*)',
    description: 'NFA with ε-transition r0 --ε--> r1; start state is ε-closure({r0}) = {r0,r1}.',
    nfa: {
      states: ['r0', 'r1'],
      alphabet: ['a', 'b'],
      transitions: {
        r0: { a: ['r0'], ε: ['r1'] },
        r1: { b: ['r1'] },
      },
      start: 'r0',
      accepting: ['r1'],
    },
    expectedStateCount: 3,
    expectedStates: ['{r0,r1}', '{r1}', '∅'],
    expectedAccepting: ['{r0,r1}', '{r1}'],
    samples: [
      { word: '', accepted: true },
      { word: 'aabb', accepted: true },
      { word: 'aba', accepted: false },
    ],
  },
  {
    name: '8. Self-loop and merged symbols',
    description: 'NFA with self-loop p0 --a--> p0 and multi-symbol transitions p0 --a,b--> p1.',
    nfa: {
      states: ['p0', 'p1'],
      alphabet: ['a', 'b'],
      transitions: {
        p0: { a: ['p0', 'p1'], b: ['p1'] },
      },
      start: 'p0',
      accepting: ['p1'],
    },
    expectedStateCount: 4,
    expectedStates: ['{p0}', '{p0,p1}', '{p1}', '∅'],
    expectedAccepting: ['{p0,p1}', '{p1}'],
    samples: [
      { word: 'a', accepted: true },
      { word: 'b', accepted: true },
      { word: 'ab', accepted: true },
      { word: 'ba', accepted: false },
    ],
  },
];

/**
 * Generates every string of length 0..maxLength over `alphabet`.
 */
function allStringsUpTo(alphabet: string[], maxLength: number): string[] {
  let level = [''];
  const result = [''];
  for (let len = 1; len <= maxLength; len++) {
    level = level.flatMap((prefix) => alphabet.map((sym) => prefix + sym));
    result.push(...level);
  }
  return result;
}

/**
 * Compares two string arrays as sets (order does not matter, no missing or extra items).
 */
function sameSet(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

/**
 * Runs a list of validation cases through `nfaToDfa.validate` and `nfaToDfa.run`,
 * comparing state counts, state sets, accepting state sets, sample string outcomes,
 * and exhaustive NFA-vs-DFA equivalence for all strings up to length 5.
 */
export function runValidationCases(cases: ValidationCase[] = VALIDATION_CASES): ValidationReport {
  const results: ValidationCaseResult[] = cases.map((tc) => {
    const errors = nfaToDfa.validate(tc.nfa);
    if (errors.length > 0) {
      return {
        name: tc.name,
        description: tc.description,
        expectedText: formatExpected(tc),
        actualText: `Validation error: ${errors.join('; ')}`,
        passed: false,
      };
    }

    const { result: dfa } = nfaToDfa.run(tc.nfa);
    const actualStateNames = dfa.states.map((s) => s.name);

    const countMatches = dfa.states.length === tc.expectedStateCount;
    const statesMatch = sameSet(actualStateNames, tc.expectedStates);
    const acceptingMatch = sameSet(dfa.accepting, tc.expectedAccepting);

    const samplePassedCount = tc.samples.filter(
      (sample) => dfaAccepts(dfa, sample.word) === sample.accepted,
    ).length;
    const samplesMatch = samplePassedCount === tc.samples.length;

    const wordsUpTo5 = allStringsUpTo(tc.nfa.alphabet, 5);
    const allLength5Agree = wordsUpTo5.every(
      (word) => nfaAccepts(tc.nfa, word) === dfaAccepts(dfa, word),
    );

    const passed =
      countMatches && statesMatch && acceptingMatch && samplesMatch && allLength5Agree;

    const actualAcceptingLabel =
      dfa.accepting.length === 0 ? 'none' : dfa.accepting.join(', ');

    const actualText =
      `${dfa.states.length} states (${actualStateNames.join(', ')}) | ` +
      `Accepting: ${actualAcceptingLabel} | ` +
      `Samples: ${samplePassedCount}/${tc.samples.length} | ` +
      `Len≤5 agree: ${allLength5Agree ? 'Yes' : 'No'}`;

    return {
      name: tc.name,
      description: tc.description,
      expectedText: formatExpected(tc),
      actualText,
      passed,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    results,
    passedCount,
    totalCount: results.length,
  };
}

/** Formats the hand-written expectation of a ValidationCase into readable text. */
function formatExpected(tc: ValidationCase): string {
  const acceptingLabel =
    tc.expectedAccepting.length === 0 ? 'none' : tc.expectedAccepting.join(', ');
  return (
    `${tc.expectedStateCount} states (${tc.expectedStates.join(', ')}) | ` +
    `Accepting: ${acceptingLabel} | ` +
    `Samples: ${tc.samples.length}/${tc.samples.length} | ` +
    `Len≤5 agree: Yes`
  );
}
