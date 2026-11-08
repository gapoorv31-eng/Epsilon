import { describe, expect, it } from 'vitest';
import { dfaAccepts, epsilonClosure, nfaAccepts, nfaToDfa, type DFA, type NFA } from './index';

// ---------- Test NFAs ----------

/** Strings over {a,b} ending in "ab". */
const endsInAb: NFA = nfaToDfa.exampleInput;

/** Accepts exactly the string "ab"; many transitions are missing. */
const exactlyAb: NFA = {
  states: ['p0', 'p1', 'p2'],
  alphabet: ['a', 'b'],
  transitions: { p0: { a: ['p1'] }, p1: { b: ['p2'] } },
  start: 'p0',
  accepting: ['p2'],
};

/** Even number of a's: the start state is also accepting. */
const evenAs: NFA = {
  states: ['s0', 's1'],
  alphabet: ['a'],
  transitions: { s0: { a: ['s1'] }, s1: { a: ['s0'] } },
  start: 's0',
  accepting: ['s0'],
};

/** Same as endsInAb but with no accepting states. */
const noAccepting: NFA = { ...endsInAb, accepting: [] };

/** q2 can never be reached from q0. */
const withUnreachable: NFA = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  transitions: { q0: { a: ['q0'], b: ['q1'] }, q2: { a: ['q1'] } },
  start: 'q0',
  accepting: ['q1'],
};

/** Contains "aa" or "bb": two independent guessing paths. */
const aaOrBb: NFA = {
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
};

/** ε-NFA for a*b*. */
const aStarBStar: NFA = {
  states: ['r0', 'r1'],
  alphabet: ['a', 'b'],
  transitions: { r0: { a: ['r0'], ε: ['r1'] }, r1: { b: ['r1'] } },
  start: 'r0',
  accepting: ['r1'],
};

// ---------- Helpers ----------

/** Names of all DFA states, in discovery order. */
const names = (dfa: DFA) => dfa.states.map((s) => s.name);

/** Every string over `alphabet` with length 0..maxLength. */
function allStrings(alphabet: string[], maxLength: number): string[] {
  let level = [''];
  const result = [''];
  for (let length = 1; length <= maxLength; length++) {
    level = level.flatMap((word) => alphabet.map((letter) => word + letter));
    result.push(...level);
  }
  return result;
}

// ---------- Tests ----------

describe('NFA to DFA (subset construction)', () => {
  it('1. strings ending in "ab" give DFA states {q0}, {q0,q1}, {q0,q2}', () => {
    const { result: dfa } = nfaToDfa.run(endsInAb);
    expect(names(dfa)).toEqual(['{q0}', '{q0,q1}', '{q0,q2}']);
    expect(dfa.start).toBe('{q0}');
    expect(dfa.accepting).toEqual(['{q0,q2}']);
    expect(dfa.transitions).toEqual({
      '{q0}': { a: '{q0,q1}', b: '{q0}' },
      '{q0,q1}': { a: '{q0,q1}', b: '{q0,q2}' },
      '{q0,q2}': { a: '{q0,q1}', b: '{q0}' },
    });
    expect(dfa.states[2].nfaStates).toEqual(['q0', 'q2']);
    expect(dfaAccepts(dfa, 'aab')).toBe(true);
    expect(dfaAccepts(dfa, 'aba')).toBe(false);
  });

  it('2. missing transitions lead to the dead state ∅, which loops to itself', () => {
    const { result: dfa } = nfaToDfa.run(exactlyAb);
    expect(names(dfa)).toEqual(['{p0}', '{p1}', '∅', '{p2}']);
    expect(dfa.transitions['{p0}']).toEqual({ a: '{p1}', b: '∅' });
    expect(dfa.transitions['∅']).toEqual({ a: '∅', b: '∅' });
    expect(dfa.states.find((s) => s.name === '∅')!.nfaStates).toEqual([]);
    expect(dfa.accepting).toEqual(['{p2}']);
  });

  it('3. a start state that is also accepting makes the DFA start accepting', () => {
    const { result: dfa } = nfaToDfa.run(evenAs);
    expect(dfa.start).toBe('{s0}');
    expect(dfa.accepting).toEqual(['{s0}']);
    expect(dfaAccepts(dfa, '')).toBe(true);
    expect(dfaAccepts(dfa, 'aa')).toBe(true);
    expect(dfaAccepts(dfa, 'aaa')).toBe(false);
  });

  it('4. no accepting NFA states means no accepting DFA states', () => {
    const { result: dfa } = nfaToDfa.run(noAccepting);
    expect(dfa.accepting).toEqual([]);
    expect(allStrings(['a', 'b'], 4).some((w) => dfaAccepts(dfa, w))).toBe(false);
  });

  it('5. an unreachable NFA state never appears inside a DFA state', () => {
    const { result: dfa } = nfaToDfa.run(withUnreachable);
    expect(names(dfa)).toEqual(['{q0}', '{q1}', '∅']);
    expect(dfa.states.some((s) => s.nfaStates.includes('q2'))).toBe(false);
  });

  it('6. multi-path NFA (contains "aa" or "bb") builds 9 DFA states, 6 accepting', () => {
    const { result: dfa } = nfaToDfa.run(aaOrBb);
    expect(dfa.states).toHaveLength(9);
    expect(dfa.accepting).toHaveLength(6);
    expect(dfa.transitions['{s,a1}'].a).toBe('{s,a1,a2}');
    expect(dfaAccepts(dfa, 'abba')).toBe(true);
    expect(dfaAccepts(dfa, 'ababab')).toBe(false);
  });

  it('7. ε-NFA (a*b*): start is the ε-closure and moves are followed by ε-closure', () => {
    expect(epsilonClosure(aStarBStar, ['r0'])).toEqual(['r0', 'r1']);
    const { result: dfa } = nfaToDfa.run(aStarBStar);
    expect(names(dfa)).toEqual(['{r0,r1}', '{r1}', '∅']);
    expect(dfa.transitions['{r0,r1}']).toEqual({ a: '{r0,r1}', b: '{r1}' });
    expect(dfa.accepting).toEqual(['{r0,r1}', '{r1}']);
    expect(dfa.alphabet).not.toContain('ε');
    expect(dfaAccepts(dfa, 'aabb')).toBe(true);
    expect(dfaAccepts(dfa, 'aba')).toBe(false);
  });

  it('7b. ε-closure follows chains of ε-moves', () => {
    const chain: NFA = {
      states: ['x', 'y', 'z'],
      alphabet: ['a'],
      transitions: { x: { ε: ['y'] }, y: { ε: ['z'] } },
      start: 'x',
      accepting: ['z'],
    };
    expect(epsilonClosure(chain, ['x'])).toEqual(['x', 'y', 'z']);
    expect(nfaAccepts(chain, '')).toBe(true);
  });

  it('8. invalid input returns clear error messages', () => {
    expect(nfaToDfa.validate(endsInAb)).toEqual([]);

    expect(
      nfaToDfa.validate({ states: [], alphabet: [], transitions: {}, start: 'q0', accepting: [] }),
    ).toEqual([
      'There must be at least one state.',
      'The alphabet must not be empty.',
      "Start state 'q0' is not in the list of states.",
    ]);

    expect(
      nfaToDfa.validate({
        states: ['q0', 'q1'],
        alphabet: ['a', 'ε'],
        transitions: { q0: { c: ['q1'], a: ['q9'] }, q5: { a: ['q0'] } },
        start: 'q0',
        accepting: ['q7'],
      }),
    ).toEqual([
      "The alphabet must not contain 'ε'; it is reserved for epsilon moves.",
      "Accepting state 'q7' is not in the list of states.",
      "Transition from 'q0' uses unknown symbol 'c'.",
      "Transition from 'q0' on 'a' goes to unknown state 'q9'.",
      "Transition from unknown state 'q5'.",
    ]);
  });

  it('9. NFA and DFA agree on every string up to length 6', () => {
    for (const nfa of [endsInAb, exactlyAb, evenAs, noAccepting, withUnreachable, aaOrBb, aStarBStar]) {
      const { result: dfa } = nfaToDfa.run(nfa);
      for (const word of allStrings(nfa.alphabet, 6)) {
        expect(dfaAccepts(dfa, word), `word "${word}"`).toBe(nfaAccepts(nfa, word));
      }
    }
  });

  it('10. steps: one start step plus one per (DFA state, symbol), with correct isNew flags', () => {
    const { steps, result: dfa } = nfaToDfa.run(endsInAb);
    expect(steps).toHaveLength(1 + dfa.states.length * dfa.alphabet.length);
    expect(steps.map((s) => s.data.isNew)).toEqual([true, true, false, false, true, false, false]);
    expect(steps[4].data).toEqual({
      from: '{q0,q1}',
      symbol: 'b',
      moveResult: ['q0', 'q2'],
      to: '{q0,q2}',
      isNew: true,
    });
    for (const step of steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});
