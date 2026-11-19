import { useState } from 'react';
import type { CFG } from '../../algorithms/cfgToCnf';
import ErrorBox from '../ErrorBox';
import type { InputFormProps } from '../types';
import { formatGrammarText, parseGrammarText } from './grammarParser';

/**
 * The CFG input form: a single textarea with one rule per line,
 * plus Load example / Clear / Convert buttons and clear parse error reporting.
 */
export default function CfgForm({ exampleInput, onSubmit, onClear }: InputFormProps<CFG>) {
  const [text, setText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  function handleLoadExample() {
    setText(formatGrammarText(exampleInput));
    setParseErrors([]);
  }

  function handleClear() {
    setText('');
    setParseErrors([]);
    onClear();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { grammar, errors } = parseGrammarText(text);
    if (errors.length > 0 || !grammar) {
      setParseErrors(errors);
      onClear();
      return;
    }
    setParseErrors([]);
    onSubmit(grammar);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="cfg-rules">Context-Free Grammar Rules</label>
        <p className="hint">
          One rule per line (e.g. <code>S -&gt; A S B | ε</code>). Separate symbols with spaces, alternatives with{' '}
          <code>|</code>, and write epsilon as <code>ε</code> or <code>eps</code>. Symbols starting with an uppercase
          letter (<code>A–Z</code>) are variables; all others are terminals. The first rule&apos;s left-hand side is
          the start symbol.
        </p>
        <textarea
          id="cfg-rules"
          className="cfg-textarea"
          rows={6}
          placeholder={'S -> A S B | ε\nA -> a A S | a\nB -> S b S | A | b b'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="button-row">
        <button type="button" className="button secondary" onClick={handleLoadExample}>
          Load example
        </button>
        <button type="button" className="button secondary" onClick={handleClear}>
          Clear
        </button>
        <button type="submit" className="button primary">
          Convert
        </button>
      </div>

      {parseErrors.length > 0 && (
        <div className="cfg-parse-errors">
          <ErrorBox errors={parseErrors} />
        </div>
      )}
    </form>
  );
}
