import { describe, expect, it } from 'vitest';
import { nfaToDfa } from '../../algorithms/nfaToDfa';
import { buildNfa, emptyForm, nfaToForm, parseList, tableColumns } from './formUtils';

describe('parseList', () => {
  it('splits on commas and trims spaces', () => {
    expect(parseList('q0,q1, q2 ,  q3')).toEqual(['q0', 'q1', 'q2', 'q3']);
  });

  it('ignores empty entries and blank text', () => {
    expect(parseList(' q0,, ,q1, ')).toEqual(['q0', 'q1']);
    expect(parseList('')).toEqual([]);
    expect(parseList('   ')).toEqual([]);
  });
});

describe('tableColumns', () => {
  it('adds an ε column after the alphabet', () => {
    expect(tableColumns(['a', 'b'])).toEqual(['a', 'b', 'ε']);
  });
});

describe('buildNfa', () => {
  it('trims fields and skips empty cells (no move)', () => {
    const nfa = buildNfa({
      states: ' q0 , q1 ,',
      alphabet: 'a, ,b',
      start: '  q0 ',
      accepting: ' q1 ,',
      cells: {
        q0: { a: ' q0 , q1 ', b: '', ε: '  ' },
        q1: { b: ',q1,' },
      },
    });
    expect(nfa).toEqual({
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      transitions: { q0: { a: ['q0', 'q1'] }, q1: { b: ['q1'] } },
      start: 'q0',
      accepting: ['q1'],
    });
  });

  it('keeps ε cells and ignores cells for removed states or symbols', () => {
    const nfa = buildNfa({
      states: 'q0',
      alphabet: 'a',
      start: 'q0',
      accepting: '',
      cells: { q0: { a: 'q0', ε: 'q0', c: 'q0' }, old: { a: 'q0' } },
    });
    expect(nfa.transitions).toEqual({ q0: { a: ['q0'], ε: ['q0'] } });
  });

  it('an empty form gives an empty NFA', () => {
    expect(buildNfa(emptyForm)).toEqual({ states: [], alphabet: [], transitions: {}, start: '', accepting: [] });
  });
});

describe('nfaToForm', () => {
  it('turns the example NFA into form text', () => {
    const form = nfaToForm(nfaToDfa.exampleInput);
    expect(form.states).toBe('q0, q1, q2');
    expect(form.alphabet).toBe('a, b');
    expect(form.start).toBe('q0');
    expect(form.accepting).toBe('q2');
    expect(form.cells.q0.a).toBe('q0, q1');
  });

  it('buildNfa(nfaToForm(nfa)) gives back the same NFA', () => {
    expect(buildNfa(nfaToForm(nfaToDfa.exampleInput))).toEqual(nfaToDfa.exampleInput);
  });
});
