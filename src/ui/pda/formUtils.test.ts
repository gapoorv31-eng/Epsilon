import { describe, expect, it } from 'vitest';
import { EPSILON, pda } from '../../algorithms/pda';
import { buildPdaInput, emptyPdaForm, parseList, pdaInputToForm } from './formUtils';

describe('pda formUtils', () => {
  it('round-trips exampleInput through pdaInputToForm and buildPdaInput', () => {
    const form = pdaInputToForm(pda.exampleInput);
    const rebuilt = buildPdaInput(form);
    expect(rebuilt).toEqual(pda.exampleInput);
  });

  it('normalizes "eps" to ε for input and "" for push', () => {
    const form = {
      ...emptyPdaForm,
      states: 'q0, q1',
      inputAlphabet: 'a',
      stackAlphabet: 'Z',
      start: 'q0',
      initialStackSymbol: 'Z',
      accepting: 'q1',
      transitions: [{ from: 'q0', input: 'eps', top: 'Z', to: 'q1', push: 'eps' }],
    };
    const built = buildPdaInput(form);
    expect(built.machine.transitions[0]).toEqual({
      from: 'q0',
      input: EPSILON,
      top: 'Z',
      to: 'q1',
      push: '',
    });
  });

  it('parses comma-separated lists cleanly', () => {
    expect(parseList(' q0, q1 , q0, ')).toEqual(['q0', 'q1']);
  });
});
