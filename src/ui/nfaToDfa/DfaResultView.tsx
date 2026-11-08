import { DEAD_STATE, type DFA } from '../../algorithms/nfaToDfa';
import type { ResultViewProps } from '../types';

/**
 * Shows the resulting DFA: a one-line summary and its transition table.
 * The start state gets an arrow (→), accepting rows are highlighted,
 * and the dead state ∅ is shown in a subtle grey style.
 */
export default function DfaResultView({ result: dfa }: ResultViewProps<DFA>) {
  const acceptingCount = dfa.accepting.length;

  return (
    <div>
      <h3 className="section-title">Resulting DFA</h3>
      <p className="summary">
        {dfa.states.length} DFA {dfa.states.length === 1 ? 'state' : 'states'}, {acceptingCount} accepting
      </p>

      <div className="table-scroll">
        <table className="table dfa-table">
          <thead>
            <tr>
              <th>DFA state</th>
              <th>NFA states</th>
              {dfa.alphabet.map((symbol) => (
                <th key={symbol}>{symbol}</th>
              ))}
              <th>Accepting?</th>
            </tr>
          </thead>
          <tbody>
            {dfa.states.map((state) => {
              const isAccepting = dfa.accepting.includes(state.name);
              return (
                <tr key={state.name} className={rowClass(state.name, isAccepting)}>
                  <th scope="row">
                    {state.name === dfa.start && <span className="start-arrow" title="Start state">→ </span>}
                    {state.name}
                  </th>
                  <td>{state.nfaStates.length === 0 ? '(none)' : state.nfaStates.join(', ')}</td>
                  {dfa.alphabet.map((symbol) => {
                    const target = dfa.transitions[state.name][symbol];
                    return (
                      <td key={symbol} className={target === DEAD_STATE ? 'dead' : undefined}>
                        {target}
                      </td>
                    );
                  })}
                  <td>{isAccepting ? <strong>Yes</strong> : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">→ marks the start state. Highlighted rows are accepting. ∅ is the dead state.</p>
    </div>
  );
}

/** Picks the CSS class for a table row: accepting, dead state, or normal. */
function rowClass(name: string, isAccepting: boolean): string | undefined {
  if (isAccepting) return 'accepting-row';
  if (name === DEAD_STATE) return 'dead-row';
  return undefined;
}
