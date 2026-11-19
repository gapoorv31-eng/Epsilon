import { describe, expect, it } from 'vitest';
import { EPSILON, pda, type PDA, type PdaInput } from './index';

/** Generates all strings over `alphabet` up to `maxLength`. */
function allStrings(alphabet: string[], maxLength: number): string[] {
  let level = [''];
  const result = [''];
  for (let len = 1; len <= maxLength; len++) {
    level = level.flatMap((w) => alphabet.map((ch) => w + ch));
    result.push(...level);
  }
  return result;
}

/** Independent checker for { a^n b^n : n >= 0 }. */
function isAnBn(s: string): boolean {
  let i = 0;
  while (i < s.length && s[i] === 'a') i++;
  let j = i;
  while (j < s.length && s[j] === 'b') j++;
  return j === s.length && i === s.length - i;
}

/** Independent checker for even-length palindromes w w^R over {a, b}. */
function isEvenPalindrome(s: string): boolean {
  if (s.length % 2 !== 0) return false;
  for (let i = 0; i < s.length / 2; i++) {
    if (s[i] !== s[s.length - 1 - i]) return false;
  }
  return true;
}

/** Independent checker for balanced parentheses over {(, )}. */
function isBalancedParens(s: string): boolean {
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else return false;
    if (depth < 0) return false;
  }
  return depth === 0;
}

const emptyStackAnBnMachine: PDA = {
  states: ['q0', 'q1'],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['Z', 'A'],
  start: 'q0',
  initialStackSymbol: 'Z',
  // Empty-stack mode ignores the accepting set.
  accepting: [],
  acceptanceMode: 'empty-stack',
  transitions: [
    { from: 'q0', input: 'a', top: 'Z', to: 'q0', push: 'AZ' },
    { from: 'q0', input: 'a', top: 'A', to: 'q0', push: 'AA' },
    { from: 'q0', input: EPSILON, top: 'Z', to: 'q0', push: '' },
    { from: 'q0', input: 'b', top: 'A', to: 'q1', push: '' },
    { from: 'q1', input: 'b', top: 'A', to: 'q1', push: '' },
    { from: 'q1', input: EPSILON, top: 'Z', to: 'q1', push: '' },
  ],
};

const evenPalindromeMachine: PDA = {
  states: ['q0', 'q1', 'q2'],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['Z', 'A', 'B'],
  start: 'q0',
  initialStackSymbol: 'Z',
  accepting: ['q2'],
  acceptanceMode: 'final-state',
  transitions: [
    { from: 'q0', input: 'a', top: 'Z', to: 'q0', push: 'AZ' },
    { from: 'q0', input: 'a', top: 'A', to: 'q0', push: 'AA' },
    { from: 'q0', input: 'a', top: 'B', to: 'q0', push: 'AB' },
    { from: 'q0', input: 'b', top: 'Z', to: 'q0', push: 'BZ' },
    { from: 'q0', input: 'b', top: 'A', to: 'q0', push: 'BA' },
    { from: 'q0', input: 'b', top: 'B', to: 'q0', push: 'BB' },
    { from: 'q0', input: EPSILON, top: 'Z', to: 'q1', push: 'Z' },
    { from: 'q0', input: EPSILON, top: 'A', to: 'q1', push: 'A' },
    { from: 'q0', input: EPSILON, top: 'B', to: 'q1', push: 'B' },
    { from: 'q1', input: 'a', top: 'A', to: 'q1', push: '' },
    { from: 'q1', input: 'b', top: 'B', to: 'q1', push: '' },
    { from: 'q1', input: EPSILON, top: 'Z', to: 'q2', push: 'Z' },
  ],
};

const balancedParensMachine: PDA = {
  states: ['q0', 'q1'],
  inputAlphabet: ['(', ')'],
  stackAlphabet: ['Z', 'P'],
  start: 'q0',
  initialStackSymbol: 'Z',
  accepting: ['q1'],
  acceptanceMode: 'final-state',
  transitions: [
    { from: 'q0', input: '(', top: 'Z', to: 'q0', push: 'PZ' },
    { from: 'q0', input: '(', top: 'P', to: 'q0', push: 'PP' },
    { from: 'q0', input: ')', top: 'P', to: 'q0', push: '' },
    { from: 'q0', input: EPSILON, top: 'Z', to: 'q1', push: 'Z' },
  ],
};

describe('Pushdown Automaton Simulator', () => {
  it('1. accepts "", "ab", "aabb" with exact path and rejects "aab", "abb", "ba" for final-state a^n b^n', () => {
    const base = pda.exampleInput.machine;
    expect(pda.validate(pda.exampleInput)).toEqual([]);

    expect(pda.run({ machine: base, inputString: '' }).result.status).toBe('accepted');
    expect(pda.run({ machine: base, inputString: 'ab' }).result.status).toBe('accepted');

    const aabb = pda.run({ machine: base, inputString: 'aabb' });
    expect(aabb.result.status).toBe('accepted');
    expect(aabb.result.path.map((e) => e.config)).toEqual([
      { state: 'q0', remainingInput: 'aabb', stack: 'Z' },
      { state: 'q0', remainingInput: 'abb', stack: 'AZ' },
      { state: 'q0', remainingInput: 'bb', stack: 'AAZ' },
      { state: 'q1', remainingInput: 'b', stack: 'AZ' },
      { state: 'q1', remainingInput: '', stack: 'Z' },
      { state: 'q2', remainingInput: '', stack: 'Z' },
    ]);

    expect(pda.run({ machine: base, inputString: 'aab' }).result.status).toBe('rejected');
    expect(pda.run({ machine: base, inputString: 'abb' }).result.status).toBe('rejected');
    expect(pda.run({ machine: base, inputString: 'ba' }).result.status).toBe('rejected');
  });

  it('2. agrees with independent isAnBn checker on all strings up to length 8 (final-state)', () => {
    const machine = pda.exampleInput.machine;
    for (const s of allStrings(['a', 'b'], 8)) {
      const { result } = pda.run({ machine, inputString: s });
      expect(result.status).toBe(isAnBn(s) ? 'accepted' : 'rejected');
    }
  });

  it('3. accepts { a^n b^n : n >= 0 } by empty-stack (ignoring accepting set) and agrees up to length 8', () => {
    expect(pda.validate({ machine: emptyStackAnBnMachine, inputString: 'aabb' })).toEqual([]);
    expect(pda.run({ machine: emptyStackAnBnMachine, inputString: '' }).result.status).toBe('accepted');
    expect(pda.run({ machine: emptyStackAnBnMachine, inputString: 'aabb' }).result.status).toBe('accepted');
    expect(pda.run({ machine: emptyStackAnBnMachine, inputString: 'aab' }).result.status).toBe('rejected');

    for (const s of allStrings(['a', 'b'], 8)) {
      const { result } = pda.run({ machine: emptyStackAnBnMachine, inputString: s });
      expect(result.status).toBe(isAnBn(s) ? 'accepted' : 'rejected');
    }
  });

  it('4. nondeterministically decides even-length palindromes w w^R and agrees up to length 8', () => {
    expect(pda.validate({ machine: evenPalindromeMachine, inputString: 'abba' })).toEqual([]);
    expect(pda.run({ machine: evenPalindromeMachine, inputString: 'abba' }).result.status).toBe('accepted');
    expect(pda.run({ machine: evenPalindromeMachine, inputString: 'aba' }).result.status).toBe('rejected');
    expect(pda.run({ machine: evenPalindromeMachine, inputString: 'abab' }).result.status).toBe('rejected');

    for (const s of allStrings(['a', 'b'], 8)) {
      const { result } = pda.run({ machine: evenPalindromeMachine, inputString: s });
      expect(result.status).toBe(isEvenPalindrome(s) ? 'accepted' : 'rejected');
    }
  });

  it('5. decides balanced parentheses and agrees up to length 8', () => {
    expect(pda.validate({ machine: balancedParensMachine, inputString: '(())()' })).toEqual([]);
    for (const s of allStrings(['(', ')'], 8)) {
      const { result } = pda.run({ machine: balancedParensMachine, inputString: s });
      expect(result.status).toBe(isBalancedParens(s) ? 'accepted' : 'rejected');
    }
  });

  it('6. stops an infinite ε-loop via guards and returns "undecided: limit reached"', () => {
    const loopMachine: PDA = {
      states: ['q0', 'q1'],
      inputAlphabet: ['a'],
      stackAlphabet: ['Z', 'A'],
      start: 'q0',
      initialStackSymbol: 'Z',
      accepting: ['q1'],
      acceptanceMode: 'final-state',
      transitions: [
        // Top-first "ZA" keeps Z on top forever, growing the stack indefinitely.
        { from: 'q0', input: EPSILON, top: 'Z', to: 'q0', push: 'ZA' },
      ],
    };

    const { result } = pda.run({
      machine: loopMachine,
      inputString: 'a',
      maxConfigurations: 50,
      maxStackHeight: 10,
    });
    expect(result.status).toBe('undecided');
    expect(result.reason).toBe('undecided: limit reached');
  });

  it('7. returns "accepted" when an ε-loop machine also has an accepting branch', () => {
    const loopWithAccept: PDA = {
      states: ['q0', 'q1'],
      inputAlphabet: ['a'],
      stackAlphabet: ['Z', 'A'],
      start: 'q0',
      initialStackSymbol: 'Z',
      accepting: ['q1'],
      acceptanceMode: 'final-state',
      transitions: [
        { from: 'q0', input: EPSILON, top: 'Z', to: 'q0', push: 'ZA' },
        { from: 'q0', input: 'a', top: 'Z', to: 'q1', push: 'Z' },
      ],
    };

    const { result } = pda.run({
      machine: loopWithAccept,
      inputString: 'a',
      maxStackHeight: 5,
    });
    expect(result.status).toBe('accepted');
  });

  it('8. returns the deepest path on rejection, breaking ties by earliest BFS discovery', () => {
    const tieMachine: PDA = {
      states: ['q0', 'q1', 'q2', 'q3'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['Z'],
      start: 'q0',
      initialStackSymbol: 'Z',
      accepting: ['q3'],
      acceptanceMode: 'final-state',
      transitions: [
        // Both branches consume 'a' and get stuck at remainingInput "b".
        { from: 'q0', input: 'a', top: 'Z', to: 'q1', push: 'Z' },
        { from: 'q0', input: 'a', top: 'Z', to: 'q2', push: 'Z' },
      ],
    };

    const { result } = pda.run({ machine: tieMachine, inputString: 'ab' });
    expect(result.status).toBe('rejected');
    expect(result.path.map((p) => p.config.state)).toEqual(['q0', 'q1']);
    expect(result.path[1].config.remainingInput).toBe('b');
  });

  it('9. formats step descriptions with "Without reading input" for ε and "pop" for empty push', () => {
    const { steps } = pda.run(pda.exampleInput);
    expect(steps[0].title).toBe('Initial configuration');
    expect(steps[1].description).toBe('Read a, top is Z: push AZ on top, stay in q0.');
    expect(steps[3].description).toBe('Read b, top is A: pop, move to q1.');
    expect(steps[5].description).toBe('Without reading input, top is Z: push Z on top, move to q2.');
  });

  it('10. validates invalid machines and input strings with clear error messages', () => {
    const bad: PdaInput = {
      inputString: 'ac',
      machine: {
        states: ['q0'],
        inputAlphabet: ['a'],
        stackAlphabet: ['Z'],
        start: 'q9',
        initialStackSymbol: 'X',
        accepting: ['q8'],
        acceptanceMode: 'final-state',
        transitions: [{ from: 'q0', input: 'a', top: 'Z', to: 'q0', push: 'Y' }],
      },
    };

    const errors = pda.validate(bad);
    expect(errors).toContain("Start state 'q9' is not in the list of states.");
    expect(errors).toContain("Initial stack symbol 'X' is not in the stack alphabet.");
    expect(errors).toContain("Accepting state 'q8' is not in the list of states.");
    expect(errors).toContain("Input string character 'c' is not in the input alphabet.");
    expect(errors).toContain("Transition #1: push symbol 'Y' is not in the stack alphabet.");
  });
});
