import { describe, expect, it } from 'vitest';
import { nfaToDfa, type NFA } from '../../algorithms/nfaToDfa';
import { findMultiCharSymbols, findUnknownSymbols, traceDfa, traceNfa } from './stringTrace';

const exampleNfa = nfaToDfa.exampleInput;
const { result: exampleDfa } = nfaToDfa.run(exampleNfa);

describe('traceNfa and traceDfa', () => {
  it('traces an accepted string ("aab") on both the NFA and the DFA', () => {
    const nfaTrace = traceNfa(exampleNfa, 'aab');
    expect(nfaTrace.unknownSymbols).toEqual([]);
    expect(nfaTrace.accepted).toBe(true);
    expect(nfaTrace.rows).toEqual([
      { step: 0, symbol: null, states: ['q0'], stateLabel: '{q0}', hasAccepting: false },
      { step: 1, symbol: 'a', states: ['q0', 'q1'], stateLabel: '{q0,q1}', hasAccepting: false },
      { step: 2, symbol: 'a', states: ['q0', 'q1'], stateLabel: '{q0,q1}', hasAccepting: false },
      { step: 3, symbol: 'b', states: ['q0', 'q2'], stateLabel: '{q0,q2}', hasAccepting: true },
    ]);

    const dfaTrace = traceDfa(exampleDfa, 'aab');
    expect(dfaTrace.unknownSymbols).toEqual([]);
    expect(dfaTrace.accepted).toBe(true);
    expect(dfaTrace.startState).toBe('{q0}');
    expect(dfaTrace.finalState).toBe('{q0,q2}');
    expect(dfaTrace.hops).toEqual([
      { from: '{q0}', symbol: 'a', to: '{q0,q1}' },
      { from: '{q0,q1}', symbol: 'a', to: '{q0,q1}' },
      { from: '{q0,q1}', symbol: 'b', to: '{q0,q2}' },
    ]);
  });

  it('traces a rejected string ("aba") on both the NFA and the DFA', () => {
    const nfaTrace = traceNfa(exampleNfa, 'aba');
    expect(nfaTrace.accepted).toBe(false);
    expect(nfaTrace.rows[3]).toEqual({
      step: 3,
      symbol: 'a',
      states: ['q0', 'q1'],
      stateLabel: '{q0,q1}',
      hasAccepting: false,
    });

    const dfaTrace = traceDfa(exampleDfa, 'aba');
    expect(dfaTrace.accepted).toBe(false);
    expect(dfaTrace.finalState).toBe('{q0,q1}');
  });

  it('traces the empty string ("") with only the start row on NFA and zero hops on DFA', () => {
    const nfaTrace = traceNfa(exampleNfa, '');
    expect(nfaTrace.accepted).toBe(false);
    expect(nfaTrace.rows).toEqual([
      { step: 0, symbol: null, states: ['q0'], stateLabel: '{q0}', hasAccepting: false },
    ]);

    const dfaTrace = traceDfa(exampleDfa, '');
    expect(dfaTrace.accepted).toBe(false);
    expect(dfaTrace.hops).toEqual([]);
    expect(dfaTrace.finalState).toBe('{q0}');
  });

  it('reports unknown characters (including spaces) without trimming', () => {
    expect(findUnknownSymbols(['a', 'b'], 'a b c')).toEqual([' ', 'c']);

    const nfaTrace = traceNfa(exampleNfa, 'abc');
    expect(nfaTrace.unknownSymbols).toEqual(['c']);
    expect(nfaTrace.rows).toEqual([]);

    const dfaTrace = traceDfa(exampleDfa, 'ab ');
    expect(dfaTrace.unknownSymbols).toEqual([' ']);
    expect(dfaTrace.hops).toEqual([]);
  });

  it('detects multi-character alphabet symbols and reports them instead of unknown symbols', () => {
    const multiCharNfa: NFA = {
      states: ['q0'],
      alphabet: ['ab', 'c'],
      transitions: { q0: { ab: ['q0'] } },
      start: 'q0',
      accepting: ['q0'],
    };
    const { result: multiCharDfa } = nfaToDfa.run(multiCharNfa);

    expect(findMultiCharSymbols(multiCharNfa.alphabet)).toEqual(['ab']);
    expect(traceNfa(multiCharNfa, 'ab').multiCharAlphabetSymbols).toEqual(['ab']);
    expect(traceNfa(multiCharNfa, 'ab').unknownSymbols).toEqual([]);
    expect(traceDfa(multiCharDfa, 'ab').multiCharAlphabetSymbols).toEqual(['ab']);
  });
});
