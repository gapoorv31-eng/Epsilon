import { DEAD_STATE, type DFA } from '../../algorithms/nfaToDfa';
import type { ResultViewProps } from '../types';
import { buildPartialDfa } from './partialDfa';

/**
 * Shows the resulting DFA: a one-line summary and its transition table.
 * When `steps` and `currentStep` are passed, reveals rows and cells progressively
 * as each step is reached, highlighting the active row/cell and newly found states.
 */
export default function DfaResultView({ result: dfa, steps, currentStep }: ResultViewProps<DFA>) {
  const isStepMode = steps !== undefined && currentStep !== undefined && steps.length > 0;
  const isComplete = !isStepMode || currentStep >= steps.length - 1;
  const partial = isStepMode ? buildPartialDfa(steps, currentStep, dfa) : null;

  const visibleStates = partial ? partial.states : dfa.states;
  const visibleAccepting = visibleStates.filter((s) => dfa.accepting.includes(s.name)).length;

  return (
    <div>
      <h3 className="section-title">Resulting DFA</h3>
      <p className="summary">
        {isComplete
          ? `${visibleStates.length} DFA ${visibleStates.length === 1 ? 'state' : 'states'}, ${visibleAccepting} accepting`
          : `${visibleStates.length} DFA ${visibleStates.length === 1 ? 'state' : 'states'} found so far (${visibleAccepting} accepting)`}
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
            {visibleStates.map((state) => {
              const isAccepting = dfa.accepting.includes(state.name);
              const isActiveRow = partial?.activeFrom === state.name;
              const isNewState = partial?.newlyDiscovered === state.name;

              return (
                <tr key={state.name} className={rowClass(state.name, isAccepting, isActiveRow)}>
                  <th scope="row">
                    {state.name === dfa.start && <span className="start-arrow" title="Start state">→ </span>}
                    {state.name}
                    {isNewState && <span className="new-badge">new</span>}
                  </th>
                  <td>{state.nfaStates.length === 0 ? '(none)' : state.nfaStates.join(', ')}</td>
                  {dfa.alphabet.map((symbol) => {
                    const target = partial
                      ? partial.cells[state.name]?.[symbol]
                      : dfa.transitions[state.name][symbol];
                    const isActiveCell = isActiveRow && partial?.activeSymbol === symbol;

                    if (target === undefined) {
                      return (
                        <td key={symbol} className="pending-cell">
                          …
                        </td>
                      );
                    }

                    return (
                      <td key={symbol} className={cellClass(target, isActiveCell)}>
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

/** Picks the CSS class for a table row: accepting, dead state, active step row, or normal. */
function rowClass(name: string, isAccepting: boolean, isActiveRow: boolean): string | undefined {
  const classes: string[] = [];
  if (isAccepting) classes.push('accepting-row');
  else if (name === DEAD_STATE) classes.push('dead-row');
  if (isActiveRow) classes.push('active-row');
  return classes.length > 0 ? classes.join(' ') : undefined;
}

/** Picks the CSS class for a transition cell: active cell and/or dead state. */
function cellClass(target: string, isActiveCell: boolean): string | undefined {
  const classes: string[] = [];
  if (target === DEAD_STATE) classes.push('dead');
  if (isActiveCell) classes.push('active-cell');
  return classes.length > 0 ? classes.join(' ') : undefined;
}
