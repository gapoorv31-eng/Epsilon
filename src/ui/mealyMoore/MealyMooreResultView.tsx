import type {
  MealyMachine,
  MealyMooreInput,
  MealyMooreResult,
  MooreMachine,
} from '../../algorithms/mealyMoore';
import GraphView from '../graph/GraphView';
import type { ResultViewProps } from '../types';
import { machineToGraph } from './graphData';
import { buildPartialMachine } from './partialMachine';

/**
 * Displays side-by-side original and converted machine graphs, plus the
 * converted machine's transition table revealed progressively from `steps`.
 */
export default function MealyMooreResultView({
  result,
  input,
  runKey = 0,
  steps,
  currentStep,
}: ResultViewProps<MealyMooreResult, MealyMooreInput>) {
  const isStepMode = steps !== undefined && currentStep !== undefined && steps.length > 0;
  const isComplete = !isStepMode || currentStep >= steps.length - 1;
  const partial = isStepMode ? buildPartialMachine(steps, currentStep, result) : null;

  const originalGraph = input ? machineToGraph(input.machine) : null;
  const convertedGraph = machineToGraph(result, partial);
  const visibleStates = partial ? partial.revealedStates : result.states;

  const originalLabel = input?.machine.kind === 'mealy' ? 'Original Mealy Machine' : 'Original Moore Machine';
  const convertedLabel = result.kind === 'moore' ? 'Converted Moore Machine' : 'Converted Mealy Machine';

  return (
    <div>
      {originalGraph && (
        <>
          <h3 className="section-title">State Diagrams</h3>
          <div className="graph-grid">
            <GraphView
              title={originalLabel}
              subtitle={`${input!.machine.states.length} states`}
              graph={originalGraph}
              layoutKey={`mm-orig-${runKey}`}
            />
            <GraphView
              title={convertedLabel}
              subtitle={
                isComplete
                  ? `Complete (${result.states.length} states)`
                  : `Revealed so far (${visibleStates.length} of ${result.states.length} states)`
              }
              graph={convertedGraph}
              layoutKey={`mm-conv-${runKey}`}
            />
          </div>
        </>
      )}

      <h3 className="section-title">{convertedLabel}</h3>
      <p className="summary">
        {visibleStates.length} {visibleStates.length === 1 ? 'state' : 'states'}
        {!isComplete ? ` revealed so far (of ${result.states.length})` : ''}
      </p>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>State</th>
              {result.inputAlphabet.map((sym) => (
                <th key={sym}>On &apos;{sym}&apos;</th>
              ))}
              {result.kind === 'moore' && <th>Output</th>}
            </tr>
          </thead>
          <tbody>
            {visibleStates.map((state) => {
              const isActiveRow = partial?.activeFrom === state;
              const isNew = partial?.newlyCreated === state;

              return (
                <tr key={state} className={isActiveRow ? 'active-row' : undefined}>
                  <th scope="row">
                    {state === result.start && (
                      <span className="start-arrow" title="Start state">
                        →{' '}
                      </span>
                    )}
                    {state}
                    {isNew && <span className="new-badge">new</span>}
                  </th>
                  {result.inputAlphabet.map((sym) => {
                    const isActiveCell = isActiveRow && partial?.activeSymbol === sym;
                    const cell = partial
                      ? partial.revealedCells[state]?.[sym]
                      : getFullCell(result, state, sym);

                    if (!cell) {
                      return (
                        <td key={sym} className="pending-cell">
                          …
                        </td>
                      );
                    }

                    const display =
                      result.kind === 'mealy' ? `${cell.nextState} / ${cell.output}` : cell.nextState;

                    return (
                      <td key={sym} className={isActiveCell ? 'active-cell' : undefined}>
                        {display}
                      </td>
                    );
                  })}
                  {result.kind === 'moore' && <td>{(result as MooreMachine).outputs[state]}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">→ marks the start state.</p>
    </div>
  );
}

/** Reads one cell from a completed Mealy or Moore machine. */
function getFullCell(
  machine: MealyMooreResult,
  state: string,
  symbol: string
): { nextState: string; output?: string } | undefined {
  if (machine.kind === 'mealy') {
    const move = (machine as MealyMachine).transitions[state]?.[symbol];
    return move ? { nextState: move.nextState, output: move.output } : undefined;
  }
  const nextState = (machine as MooreMachine).transitions[state]?.[symbol];
  return nextState ? { nextState } : undefined;
}
