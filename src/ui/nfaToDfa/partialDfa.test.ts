import { describe, expect, it } from 'vitest';
import { nfaToDfa, type NFA } from '../../algorithms/nfaToDfa';
import { buildPartialDfa, formatNfaSteps } from './partialDfa';

/** Dead-state NFA from the task: q0 on a -> q1, missing all other transitions. */
const deadStateNfa: NFA = {
  states: ['q0', 'q1'],
  alphabet: ['a', 'b'],
  transitions: { q0: { a: ['q1'] } },
  start: 'q0',
  accepting: ['q1'],
};

/** ε-NFA for a*b* (r0 --ε--> r1). */
const epsilonNfa: NFA = {
  states: ['r0', 'r1'],
  alphabet: ['a', 'b'],
  transitions: { r0: { a: ['r0'], ε: ['r1'] }, r1: { b: ['r1'] } },
  start: 'r0',
  accepting: ['r1'],
};

describe('buildPartialDfa', () => {
  it('progressively reveals states and cells across all 7 steps of the "ends in ab" example', () => {
    const { steps, result: dfa } = nfaToDfa.run(nfaToDfa.exampleInput);
    expect(steps).toHaveLength(7);

    // Step 1 (index 0): start state {q0} discovered; no transition cells filled yet.
    const step1 = buildPartialDfa(steps, 0, dfa);
    expect(step1.states).toEqual([{ name: '{q0}', nfaStates: ['q0'] }]);
    expect(step1.cells).toEqual({ '{q0}': {} });
    expect(step1.activeFrom).toBeNull();
    expect(step1.activeSymbol).toBeNull();
    expect(step1.newlyDiscovered).toBe('{q0}');

    // Step 2 (index 1): δ({q0}, a) = {q0,q1} reveals {q0,q1}.
    const step2 = buildPartialDfa(steps, 1, dfa);
    expect(step2.states.map((s) => s.name)).toEqual(['{q0}', '{q0,q1}']);
    expect(step2.states[1].nfaStates).toEqual(['q0', 'q1']);
    expect(step2.cells['{q0}']).toEqual({ a: '{q0,q1}' });
    expect(step2.activeFrom).toBe('{q0}');
    expect(step2.activeSymbol).toBe('a');
    expect(step2.newlyDiscovered).toBe('{q0,q1}');

    // Step 3 (index 2): δ({q0}, b) = {q0} (already known).
    const step3 = buildPartialDfa(steps, 2, dfa);
    expect(step3.states.map((s) => s.name)).toEqual(['{q0}', '{q0,q1}']);
    expect(step3.cells['{q0}']).toEqual({ a: '{q0,q1}', b: '{q0}' });
    expect(step3.newlyDiscovered).toBeNull();

    // Step 4 (index 3): δ({q0,q1}, a) = {q0,q1} (already known).
    const step4 = buildPartialDfa(steps, 3, dfa);
    expect(step4.states.map((s) => s.name)).toEqual(['{q0}', '{q0,q1}']);
    expect(step4.cells['{q0,q1}']).toEqual({ a: '{q0,q1}' });
    expect(step4.newlyDiscovered).toBeNull();

    // Step 5 (index 4): δ({q0,q1}, b) = {q0,q2} reveals {q0,q2}.
    const step5 = buildPartialDfa(steps, 4, dfa);
    expect(step5.states.map((s) => s.name)).toEqual(['{q0}', '{q0,q1}', '{q0,q2}']);
    expect(step5.states[2].nfaStates).toEqual(['q0', 'q2']);
    expect(step5.cells['{q0,q1}']).toEqual({ a: '{q0,q1}', b: '{q0,q2}' });
    expect(step5.activeFrom).toBe('{q0,q1}');
    expect(step5.activeSymbol).toBe('b');
    expect(step5.newlyDiscovered).toBe('{q0,q2}');

    // Step 6 (index 5): δ({q0,q2}, a) = {q0,q1}.
    const step6 = buildPartialDfa(steps, 5, dfa);
    expect(step6.cells['{q0,q2}']).toEqual({ a: '{q0,q1}' });
    expect(step6.newlyDiscovered).toBeNull();

    // Step 7 (index 6): δ({q0,q2}, b) = {q0} completes the table.
    const step7 = buildPartialDfa(steps, 6, dfa);
    expect(step7.cells['{q0,q2}']).toEqual({ a: '{q0,q1}', b: '{q0}' });
    expect(step7.newlyDiscovered).toBeNull();
  });

  it('at the last step, has the exact same rows (in order) and cells as the full DFA result', () => {
    for (const nfa of [nfaToDfa.exampleInput, deadStateNfa, epsilonNfa]) {
      const { steps, result: dfa } = nfaToDfa.run(nfa);
      const finalPartial = buildPartialDfa(steps, steps.length - 1, dfa);
      expect(finalPartial.states).toEqual(dfa.states);
      expect(finalPartial.cells).toEqual(dfa.transitions);
    }
  });

  it('handles an NFA that discovers the dead state ∅ with empty nfaStates', () => {
    const { steps, result: dfa } = nfaToDfa.run(deadStateNfa);
    // Step 1 (index 0): start {q0}
    // Step 2 (index 1): δ({q0}, a) = {q1} (new)
    // Step 3 (index 2): δ({q0}, b) = ∅ (new dead state!)
    const atDeadDiscovery = buildPartialDfa(steps, 2, dfa);
    expect(atDeadDiscovery.newlyDiscovered).toBe('∅');
    expect(atDeadDiscovery.states.map((s) => s.name)).toEqual(['{q0}', '{q1}', '∅']);
    expect(atDeadDiscovery.states[2]).toEqual({ name: '∅', nfaStates: [] });
    expect(atDeadDiscovery.cells['{q0}']).toEqual({ a: '{q1}', b: '∅' });
  });

  it('handles an ε-NFA where the start state includes ε-closure', () => {
    const { steps, result: dfa } = nfaToDfa.run(epsilonNfa);
    const step1 = buildPartialDfa(steps, 0, dfa);
    expect(step1.states).toEqual([{ name: '{r0,r1}', nfaStates: ['r0', 'r1'] }]);
    expect(step1.newlyDiscovered).toBe('{r0,r1}');

    const step2 = buildPartialDfa(steps, 1, dfa);
    expect(step2.cells['{r0,r1}']).toEqual({ a: '{r0,r1}' });
    expect(step2.newlyDiscovered).toBeNull();
  });
});

describe('formatNfaSteps', () => {
  it('produces plain-English step descriptions with per-state moves', () => {
    const nfa = nfaToDfa.exampleInput;
    const { steps, result: dfa } = nfaToDfa.run(nfa);
    const formatted = formatNfaSteps(nfa, steps, dfa);

    expect(formatted[0].description).toContain('Start at NFA state q0');
    expect(formatted[4].description).toBe(
      "From {q0,q1}, reading 'b': q0 goes to {q0} and q1 goes to {q2}, so the union is {q0,q2}. It is new, so it joins the queue.",
    );
  });
});
