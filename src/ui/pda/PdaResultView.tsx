import { EPSILON, type PdaInput, type PdaResult, type PdaStepData } from '../../algorithms/pda';
import GraphView from '../graph/GraphView';
import type { ResultViewProps } from '../types';
import { pdaToGraph } from './graphData';

/**
 * Displays the PDA simulation result: Accepted/Rejected/Undecided badge, explored count,
 * the PDA state diagram with current-step state/edge highlight, and a live configuration
 * panel showing the input tape and vertical stack.
 */
export default function PdaResultView({
  result,
  input,
  runKey = 0,
  steps,
  currentStep,
}: ResultViewProps<PdaResult, PdaInput>) {
  const isStepMode = steps !== undefined && currentStep !== undefined && steps.length > 0;
  const activeStep = isStepMode ? steps[Math.min(currentStep, steps.length - 1)] : undefined;
  const stepData = activeStep?.data as PdaStepData | undefined;

  const activeState = stepData?.state ?? result.path[result.path.length - 1]?.config.state;
  const remainingInput = stepData?.remainingInput ?? result.path[result.path.length - 1]?.config.remainingInput ?? '';
  const stack = stepData?.stack ?? result.path[result.path.length - 1]?.config.stack ?? '';
  const activeTransition = stepData?.transition ?? null;

  const fullInput = input?.inputString ?? '';
  const consumedCount = Math.max(0, fullInput.length - remainingInput.length);
  const consumedPart = fullInput.slice(0, consumedCount);

  const graph = input ? pdaToGraph(input.machine, activeState, activeTransition) : null;

  const badgeClass =
    result.status === 'accepted'
      ? 'badge badge-pass'
      : result.status === 'rejected'
        ? 'badge badge-fail'
        : 'badge badge-warn';

  const badgeText =
    result.status === 'accepted'
      ? 'Accepted'
      : result.status === 'rejected'
        ? 'Rejected'
        : 'Undecided: limit reached';

  return (
    <div>
      <div className="trace-summary-bar">
        <span className={badgeClass}>{badgeText}</span>
        <span className="hint" style={{ margin: 0 }}>
          Configurations explored: <strong>{result.exploredCount}</strong>
          {result.status !== 'accepted' && ' · Showing deepest path explored'}
        </span>
      </div>

      <div className="pda-layout">
        {graph && (
          <GraphView
            title="Pushdown Automaton"
            subtitle={`Mode: ${input!.machine.acceptanceMode === 'final-state' ? 'Final state' : 'Empty stack'} · Active state: ${activeState}`}
            graph={graph}
            layoutKey={`pda-${runKey}`}
          />
        )}

        <div className="pda-config-panel">
          <h3 className="section-title">Current Configuration</h3>
          <p className="hint">
            State: <strong>{activeState}</strong>
          </p>

          <div className="pda-section-label">Input Tape</div>
          <div className="pda-tape" aria-label="Input tape">
            {fullInput.length === 0 ? (
              <span className="pda-tape-empty">{EPSILON} (empty input)</span>
            ) : (
              <>
                {[...consumedPart].map((ch, idx) => (
                  <span key={`c-${idx}`} className="pda-tape-cell read">
                    {ch}
                  </span>
                ))}
                {[...remainingInput].map((ch, idx) => (
                  <span key={`r-${idx}`} className={idx === 0 ? 'pda-tape-cell current' : 'pda-tape-cell'}>
                    {ch}
                  </span>
                ))}
                {remainingInput.length === 0 && <span className="pda-tape-end">end</span>}
              </>
            )}
          </div>

          <div className="pda-section-label">Stack (top at top)</div>
          <div className="pda-stack" aria-label="Stack">
            {stack.length === 0 ? (
              <div className="pda-stack-empty">{EPSILON} (empty stack)</div>
            ) : (
              [...stack].map((sym, idx) => (
                <div key={idx} className={idx === 0 ? 'pda-stack-cell top' : 'pda-stack-cell'}>
                  <span>{sym}</span>
                  {idx === 0 && <span className="pda-top-tag">TOP</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
