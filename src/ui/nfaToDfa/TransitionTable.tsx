/**
 * The NFA transition table: one row per state, one column per symbol (plus ε).
 * Each cell is a text input holding comma-separated target states.
 * Values are looked up by state and symbol name, so changing the states or
 * alphabet never erases cells that still exist.
 */
export default function TransitionTable(props: {
  states: string[];
  columns: string[];
  cells: Record<string, Record<string, string>>;
  onCellChange(state: string, symbol: string, value: string): void;
}) {
  if (props.states.length === 0) {
    return <p className="hint">Enter some states to build the transition table.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>State</th>
            {props.columns.map((symbol, i) => (
              <th key={`${symbol}-${i}`}>{symbol}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.states.map((state, row) => (
            <tr key={`${state}-${row}`}>
              <th scope="row">{state}</th>
              {props.columns.map((symbol, col) => (
                <td key={`${symbol}-${col}`}>
                  <input
                    type="text"
                    className="cell-input"
                    aria-label={`δ(${state}, ${symbol})`}
                    value={props.cells[state]?.[symbol] ?? ''}
                    onChange={(event) => props.onCellChange(state, symbol, event.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
