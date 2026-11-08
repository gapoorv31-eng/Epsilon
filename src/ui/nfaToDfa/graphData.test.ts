import { describe, expect, it } from 'vitest';
import { nfaToDfa, type NFA } from '../../algorithms/nfaToDfa';
import { activeNfaStates, dfaToGraph, nfaToGraph } from './graphData';
import { buildPartialDfa } from './partialDfa';

/** Dead-state NFA: q0 on a -> q1, missing all other transitions. */
const deadStateNfa: NFA = {
  states: ['q0', 'q1'],
  alphabet: ['a', 'b'],
  transitions: { q0: { a: ['q1'] } },
  start: 'q0',
  accepting: ['q1'],
};

/** NFA with a self-loop, merged multi-symbol edge, and ε-transition. */
const loopAndEpsilonNfa: NFA = {
  states: ['s0', 's1'],
  alphabet: ['a', 'b'],
  transitions: {
    s0: { a: ['s0', 's1'], b: ['s1'], ε: ['s1'] },
    s1: { b: ['s1'] },
  },
  start: 's0',
  accepting: ['s1'],
};

describe('nfaToGraph', () => {
  it('builds one node per NFA state with start, accepting, and highlighted flags', () => {
    const graph = nfaToGraph(nfaToDfa.exampleInput, ['q0', 'q2']);
    expect(graph.nodes).toEqual([
      { id: 'q0', label: 'q0', start: true, accepting: false, highlighted: true },
      { id: 'q1', label: 'q1', start: false, accepting: false, highlighted: false },
      { id: 'q2', label: 'q2', start: false, accepting: true, highlighted: true },
    ]);
  });

  it('merges multiple symbols between the same two states, keeps self-loops, and marks ε-edges dashed', () => {
    const graph = nfaToGraph(loopAndEpsilonNfa);
    expect(graph.edges).toEqual([
      { id: 's0->s0', from: 's0', to: 's0', label: 'a', dashed: false },
      { id: 's0->s1', from: 's0', to: 's1', label: 'a,b,ε', dashed: true },
      { id: 's1->s1', from: 's1', to: 's1', label: 'b', dashed: false },
    ]);
  });
});

describe('dfaToGraph and activeNfaStates', () => {
  it('progressively reveals nodes and edges across steps of the "ends in ab" example', () => {
    const { steps, result: dfa } = nfaToDfa.run(nfaToDfa.exampleInput);

    // Step 1 (index 0): only start state {q0} is visible and marked isNew; all edges hidden.
    const partial1 = buildPartialDfa(steps, 0, dfa);
    const graph1 = dfaToGraph(dfa, partial1);
    expect(graph1.nodes.map((n) => ({ id: n.id, hidden: n.hidden, isNew: n.isNew }))).toEqual([
      { id: '{q0}', hidden: false, isNew: true },
      { id: '{q0,q1}', hidden: true, isNew: false },
      { id: '{q0,q2}', hidden: true, isNew: false },
    ]);
    expect(graph1.edges.every((e) => e.hidden)).toBe(true);
    expect(activeNfaStates(dfa, partial1)).toEqual(['q0']);

    // Step 2 (index 1, δ({q0}, a) = {q0,q1}): {q0,q1} revealed with isNew, {q0}->{q0,q1} revealed & highlighted.
    const partial2 = buildPartialDfa(steps, 1, dfa);
    const graph2 = dfaToGraph(dfa, partial2);
    expect(graph2.nodes.find((n) => n.id === '{q0}')?.highlighted).toBe(true);
    expect(graph2.nodes.find((n) => n.id === '{q0,q1}')).toMatchObject({
      hidden: false,
      isNew: true,
    });
    const edgeQ0ToQ01 = graph2.edges.find((e) => e.id === '{q0}->{q0,q1}')!;
    expect(edgeQ0ToQ01).toMatchObject({ label: 'a', hidden: false, highlighted: true });

    // Step 5 (index 4, δ({q0,q1}, b) = {q0,q2}): {q0,q2} revealed, teaching highlight on ['q0', 'q1'].
    const partial5 = buildPartialDfa(steps, 4, dfa);
    const graph5 = dfaToGraph(dfa, partial5);
    expect(graph5.nodes.find((n) => n.id === '{q0,q2}')).toMatchObject({
      hidden: false,
      isNew: true,
      accepting: true,
    });
    expect(activeNfaStates(dfa, partial5)).toEqual(['q0', 'q1']);

    // Step 7 (index 6, final step): all 3 nodes and all 6 edges visible; opposite edges between {q0,q1} and {q0,q2} exist.
    const partial7 = buildPartialDfa(steps, 6, dfa);
    const graph7 = dfaToGraph(dfa, partial7);
    expect(graph7.nodes.every((n) => !n.hidden)).toBe(true);
    expect(graph7.edges.every((e) => !e.hidden)).toBe(true);
    expect(graph7.edges.find((e) => e.id === '{q0,q1}->{q0,q2}')?.label).toBe('b');
    expect(graph7.edges.find((e) => e.id === '{q0,q2}->{q0,q1}')?.label).toBe('a');
  });

  it('marks the dead state ∅ with dead: true and merges its self-loop labels as steps progress', () => {
    const { steps, result: dfa } = nfaToDfa.run(deadStateNfa);

    // At the last step, ∅ is visible, flagged dead: true, and its self-loop has combined label "a,b".
    const finalPartial = buildPartialDfa(steps, steps.length - 1, dfa);
    const graph = dfaToGraph(dfa, finalPartial);
    const deadNode = graph.nodes.find((n) => n.id === '∅')!;
    expect(deadNode).toMatchObject({ id: '∅', dead: true, hidden: false });
    const deadLoop = graph.edges.find((e) => e.id === '∅->∅')!;
    expect(deadLoop).toMatchObject({ from: '∅', to: '∅', label: 'a,b', hidden: false });
  });
});
