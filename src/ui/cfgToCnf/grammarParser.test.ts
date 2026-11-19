import { describe, expect, it } from 'vitest';
import { cfgToCnf } from '../../algorithms/cfgToCnf';
import { formatGrammarText, parseGrammarText } from './grammarParser';

describe('CFG grammarParser', () => {
  it('parses the classic example formatted back from exampleInput', () => {
    const text = formatGrammarText(cfgToCnf.exampleInput);
    const { grammar, errors } = parseGrammarText(text);
    expect(errors).toEqual([]);
    expect(grammar).toEqual(cfgToCnf.exampleInput);
  });

  it('treats eps as ε and uppercase-initial tokens as variables', () => {
    const { grammar, errors } = parseGrammarText('S -> A B | eps\nA -> a\nB -> b');
    expect(errors).toEqual([]);
    expect(grammar).toEqual({
      variables: ['S', 'A', 'B'],
      terminals: ['a', 'b'],
      start: 'S',
      productions: {
        S: [['A', 'B'], []],
        A: [['a']],
        B: [['b']],
      },
    });
  });

  it('merges multiple lines for the same variable', () => {
    const { grammar, errors } = parseGrammarText('S -> a\nS -> b');
    expect(errors).toEqual([]);
    expect(grammar?.productions.S).toEqual([['a'], ['b']]);
  });

  it('reports clear parse errors for malformed lines', () => {
    expect(parseGrammarText('   ').errors).toContain('Please enter at least one production rule.');
    expect(parseGrammarText('S A B').errors[0]).toContain("Line 1: missing '->' arrow");
    expect(parseGrammarText('S -> A | ').errors[0]).toContain('Line 1: empty alternative');
    expect(parseGrammarText('S -> A ε').errors[0]).toContain("Line 1: 'ε' cannot be combined");
  });
});
