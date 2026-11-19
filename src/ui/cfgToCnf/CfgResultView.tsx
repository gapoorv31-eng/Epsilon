import { EPSILON, type CFG, type CfgStepData, type ProductionChange } from '../../algorithms/cfgToCnf';
import type { ResultViewProps } from '../types';

function rhsKey(rhs: string[]): string {
  return rhs.join('\0');
}

function formatRhs(rhs: string[]): string {
  return rhs.length === 0 ? EPSILON : rhs.join(' ');
}

function buildChangeSet(changes: ProductionChange[]): Set<string> {
  return new Set(changes.map((c) => `${c.lhs}\0${rhsKey(c.rhs)}`));
}

/** Renders a clean, read-only CFG production list. */
function GrammarBlock({ cfg }: { cfg: CFG }) {
  return (
    <div className="cfg-grammar">
      {cfg.variables.map((lhs) => {
        const alts = cfg.productions[lhs] ?? [];
        if (alts.length === 0) return null;
        return (
          <div key={lhs} className="cfg-rule-row">
            <span className="cfg-lhs">{lhs}</span>
            <span className="cfg-arrow">→</span>
            <span className="cfg-alts">
              {alts.map((rhs, idx) => (
                <span key={idx} className="cfg-alt">
                  {idx > 0 && <span className="cfg-pipe">|</span>}
                  <span>{formatRhs(rhs)}</span>
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Displays the CFG at the current conversion stage with added productions
 * highlighted in green and removed productions struck through in red.
 * At the last step, also displays the final CNF grammar.
 */
export default function CfgResultView({ result: finalCnf, steps, currentStep }: ResultViewProps<CFG, CFG>) {
  const isStepMode = steps !== undefined && currentStep !== undefined && steps.length > 0;
  const isLastStep = !isStepMode || currentStep >= steps.length - 1;
  const activeStep = isStepMode ? steps[currentStep] : undefined;
  const data = activeStep?.data as CfgStepData | undefined;

  if (!data) {
    return (
      <div>
        <h3 className="section-title">Final CNF Grammar</h3>
        <GrammarBlock cfg={finalCnf} />
      </div>
    );
  }

  const addedSet = buildChangeSet(data.added);
  const removedByVar = new Map<string, string[][]>();
  for (const rem of data.removed) {
    const list = removedByVar.get(rem.lhs) ?? [];
    list.push(rem.rhs);
    removedByVar.set(rem.lhs, list);
  }

  // Show all variables that exist before or after this stage in order.
  const orderedVars = [...data.after.variables];
  for (const v of data.before.variables) {
    if (!orderedVars.includes(v)) orderedVars.push(v);
  }

  return (
    <div>
      <h3 className="section-title">Grammar at {activeStep?.title}</h3>
      <p className="summary">
        <span className="cfg-badge-added">+{data.added.length} added</span>{' '}
        <span className="cfg-badge-removed">-{data.removed.length} removed</span>
      </p>

      <div className="cfg-grammar">
        {orderedVars.map((lhs) => {
          const afterAlts = data.after.productions[lhs] ?? [];
          const removedAlts = removedByVar.get(lhs) ?? [];
          if (afterAlts.length === 0 && removedAlts.length === 0) return null;

          return (
            <div key={lhs} className="cfg-rule-row">
              <span className="cfg-lhs">{lhs}</span>
              <span className="cfg-arrow">→</span>
              <span className="cfg-alts">
                {afterAlts.map((rhs, idx) => {
                  const isAdded = addedSet.has(`${lhs}\0${rhsKey(rhs)}`);
                  return (
                    <span key={`a-${idx}`} className="cfg-alt">
                      {idx > 0 && <span className="cfg-pipe">|</span>}
                      <span className={isAdded ? 'cfg-prod-added' : undefined}>{formatRhs(rhs)}</span>
                    </span>
                  );
                })}
                {removedAlts.map((rhs, idx) => (
                  <span key={`r-${idx}`} className="cfg-alt">
                    {(afterAlts.length > 0 || idx > 0) && <span className="cfg-pipe">|</span>}
                    <span className="cfg-prod-removed">{formatRhs(rhs)}</span>
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {isLastStep && (
        <div className="cfg-final-section">
          <h3 className="section-title">Final CNF Grammar</h3>
          <p className="hint">
            Start symbol: <code>{finalCnf.start}</code> · Variables: {finalCnf.variables.length} · Terminals:{' '}
            {finalCnf.terminals.length > 0 ? finalCnf.terminals.join(', ') : '(none)'}
          </p>
          <GrammarBlock cfg={finalCnf} />
        </div>
      )}
    </div>
  );
}
