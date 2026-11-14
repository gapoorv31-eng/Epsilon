import { useState } from 'react';
import { DEAD_STATE, type DFA, type NFA } from '../../algorithms/nfaToDfa';
import { traceDfa, traceNfa, type DfaTraceResult, type NfaTraceResult } from './stringTrace';

/**
 * Interactive string tester for NFA to DFA conversion.
 * Runs the user's string on both the submitted NFA and the full DFA result,
 * showing the NFA step-by-step state-set table, the DFA path, and an agreement badge.
 */
export default function StringTester({ input: nfa, result: dfa }: { input: NFA; result: DFA }) {
  const [word, setWord] = useState('');
  const [tested, setTested] = useState<{
    word: string;
    nfaTrace: NfaTraceResult;
    dfaTrace: DfaTraceResult;
  } | null>(null);

  // Run the trace on the current input box value (without trimming spaces).
  function handleTest(event: React.FormEvent) {
    event.preventDefault();
    setTested({
      word,
      nfaTrace: traceNfa(nfa, word),
      dfaTrace: traceDfa(dfa, word),
    });
  }

  const multiChar = tested?.nfaTrace.multiCharAlphabetSymbols ?? [];
  const unknown = tested?.nfaTrace.unknownSymbols ?? [];
  const hasError = multiChar.length > 0 || unknown.length > 0;
  const agrees = tested && !hasError ? tested.nfaTrace.accepted === tested.dfaTrace.accepted : false;

  return (
    <div className="string-tester">
      <h3 className="section-title">String Tester</h3>
      <p className="hint">
        Leave the box empty to test the empty string (ε). Every character (including spaces) is treated as one symbol.
      </p>

      <form className="string-tester-form" onSubmit={handleTest}>
        <input
          id="string-tester-input"
          type="text"
          className="string-tester-input"
          placeholder="Enter a string (e.g. aab) or leave empty for ε"
          aria-label="Test string"
          value={word}
          onChange={(event) => setWord(event.target.value)}
        />
        <button type="submit" className="button primary">
          Test
        </button>
      </form>

      {tested && multiChar.length > 0 && (
        <div className="error-box" role="alert">
          <strong>String testing requires single-character alphabet symbols:</strong>{' '}
          The alphabet contains multi-character symbol(s): {multiChar.map((s) => `'${s}'`).join(', ')}.
        </div>
      )}

      {tested && multiChar.length === 0 && unknown.length > 0 && (
        <div className="error-box" role="alert">
          <strong>Unknown symbol(s) in string:</strong>{' '}
          {unknown.map((ch) => (ch === ' ' ? "' ' (space)" : `'${ch}'`)).join(', ')}{' '}
          {unknown.length === 1 ? 'is' : 'are'} not in the alphabet {'{'}
          {nfa.alphabet.join(', ')}
          {'}'}.
        </div>
      )}

      {tested && !hasError && (
        <div className="trace-results">
          <div className="trace-summary-bar">
            <span className="tested-word-label">
              String:{' '}
              <code>{tested.word === '' ? 'ε (empty string)' : `"${tested.word}"`}</code>
            </span>
            <span className={agrees ? 'badge badge-pass' : 'badge badge-fail'}>
              {agrees ? 'NFA and DFA agree' : 'MISMATCH'}
            </span>
          </div>

          <div className="trace-grid">
            {/* NFA Trace Card */}
            <div className="trace-box">
              <div className="trace-box-header">
                <h4>NFA Simulation</h4>
                <span className={tested.nfaTrace.accepted ? 'badge badge-pass' : 'badge badge-fail'}>
                  {tested.nfaTrace.accepted ? 'Accepted' : 'Rejected'}
                </span>
              </div>
              <div className="table-scroll">
                <table className="table nfa-trace-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Symbol</th>
                      <th>Active NFA states</th>
                      <th>Accepting?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tested.nfaTrace.rows.map((row) => (
                      <tr key={row.step} className={row.hasAccepting ? 'accepting-row' : undefined}>
                        <td>{row.step === 0 ? 'Start' : row.step}</td>
                        <td>{row.symbol === null ? '— (start)' : `'${row.symbol}'`}</td>
                        <td className={row.stateLabel === DEAD_STATE ? 'dead' : undefined}>{row.stateLabel}</td>
                        <td>{row.hasAccepting ? <strong>Yes</strong> : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DFA Trace Card */}
            <div className="trace-box">
              <div className="trace-box-header">
                <h4>DFA Path</h4>
                <span className={tested.dfaTrace.accepted ? 'badge badge-pass' : 'badge badge-fail'}>
                  {tested.dfaTrace.accepted ? 'Accepted' : 'Rejected'}
                </span>
              </div>
              <div className="dfa-path-box" aria-label="DFA transition path">
                <span className="dfa-path-state">{tested.dfaTrace.startState}</span>
                {tested.dfaTrace.hops.map((hop, idx) => (
                  <span key={idx} className="dfa-path-step">
                    <span className="dfa-path-arrow"> -{hop.symbol}-&gt; </span>
                    <span className={hop.to === DEAD_STATE ? 'dfa-path-state dead' : 'dfa-path-state'}>
                      {hop.to}
                    </span>
                  </span>
                ))}
                {tested.dfaTrace.hops.length === 0 && (
                  <span className="hint"> (0 symbols read — stays in {tested.dfaTrace.startState})</span>
                )}
              </div>
              <p className="hint">
                Final DFA state: <strong>{tested.dfaTrace.finalState}</strong> (
                {tested.dfaTrace.accepted ? 'accepting' : 'non-accepting'}).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
