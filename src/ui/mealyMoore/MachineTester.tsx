import { useState } from 'react';
import {
  runTransducer,
  type MealyMooreInput,
  type MealyMooreResult,
} from '../../algorithms/mealyMoore';

/** Formats an output symbol list; separates symbols with spaces if any output is multi-character. */
function formatOutputSequence(outputs: string[], outputAlphabet: string[]): string {
  if (outputs.length === 0) return 'ε (empty)';
  const hasMultiChar = outputAlphabet.some((sym) => sym.length > 1) || outputs.some((sym) => sym.length > 1);
  return hasMultiChar ? outputs.join(' ') : outputs.join('');
}

/**
 * Interactive string tester for Mealy and Moore Conversion.
 * Runs the input string on both the original and converted machines and compares outputs
 * (ignoring the Moore machine's initial start-state output).
 */
export default function MachineTester({
  input,
  result,
}: {
  input: MealyMooreInput;
  result: MealyMooreResult;
}) {
  const [word, setWord] = useState('');
  const [testedWord, setTestedWord] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const original = input.machine;
  const multiCharInputSymbols = original.inputAlphabet.filter((sym) => sym.length > 1);

  /** Validates the input string and records it for comparison. */
  function handleTest(event: React.FormEvent) {
    event.preventDefault();
    if (multiCharInputSymbols.length > 0) {
      setError(
        `String testing requires single-character input symbols (found multi-character symbol: ${multiCharInputSymbols.join(', ')}).`
      );
      setTestedWord(null);
      return;
    }

    const inputSet = new Set(original.inputAlphabet);
    const unknown = [...word].filter((ch) => !inputSet.has(ch));
    if (unknown.length > 0) {
      const uniqueUnknown = [...new Set(unknown)].join(', ');
      setError(`Unknown input character(s): ${uniqueUnknown}. Allowed: ${original.inputAlphabet.join(', ')}.`);
      setTestedWord(null);
      return;
    }

    setError(null);
    setTestedWord(word);
  }

  const symbols = testedWord !== null ? [...testedWord] : null;
  const origRun = symbols !== null ? runTransducer(original, symbols) : null;
  const convRun = symbols !== null ? runTransducer(result, symbols) : null;
  const agree =
    origRun !== null &&
    convRun !== null &&
    origRun.outputs.length === convRun.outputs.length &&
    origRun.outputs.every((out, i) => out === convRun.outputs[i]);

  return (
    <div>
      <h3 className="section-title">Test Input String</h3>
      <p className="hint">
        Enter a string over {'{'}
        {original.inputAlphabet.join(', ')}
        {'}'} (or leave empty for ε) to compare outputs.
      </p>

      {multiCharInputSymbols.length > 0 ? (
        <div className="error-box" role="alert">
          String testing requires single-character input symbols (multi-character symbol found:{' '}
          {multiCharInputSymbols.join(', ')}).
        </div>
      ) : (
        <form className="string-tester-form" onSubmit={handleTest}>
          <input
            type="text"
            className="string-tester-input"
            aria-label="Input string to test"
            placeholder="e.g. 0110"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
          <button type="submit" className="button primary">
            Test String
          </button>
        </form>
      )}

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      {origRun && convRun && testedWord !== null && (
        <>
          <div className="trace-summary-bar">
            <span className="tested-word-label">
              Input: <code>{testedWord === '' ? 'ε' : testedWord}</code>
            </span>
            <span className={agree ? 'badge badge-pass' : 'badge badge-fail'}>
              {agree ? 'Outputs agree' : 'Output mismatch'}
            </span>
          </div>

          <div className="trace-grid">
            <div className="trace-box">
              <div className="trace-box-header">
                <h4>Original ({original.kind === 'mealy' ? 'Mealy' : 'Moore'})</h4>
              </div>
              <p className="mm-output-line">
                Output: <code>{formatOutputSequence(origRun.outputs, original.outputAlphabet)}</code>
              </p>
              {original.kind === 'moore' && (
                <p className="hint">
                  Full Moore output (with start output):{' '}
                  <code>{formatOutputSequence(origRun.fullOutputs, original.outputAlphabet)}</code>
                </p>
              )}
            </div>

            <div className="trace-box">
              <div className="trace-box-header">
                <h4>Converted ({result.kind === 'mealy' ? 'Mealy' : 'Moore'})</h4>
              </div>
              <p className="mm-output-line">
                Output: <code>{formatOutputSequence(convRun.outputs, result.outputAlphabet)}</code>
              </p>
              {result.kind === 'moore' && (
                <p className="hint">
                  Full Moore output (with start output):{' '}
                  <code>{formatOutputSequence(convRun.fullOutputs, result.outputAlphabet)}</code>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
