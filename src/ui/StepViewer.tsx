import { useEffect, useRef } from 'react';
import type { Step } from '../algorithms/types';
import type { StepperControls } from './useStepper';

/**
 * Generic step-by-step controller that works with any algorithm's Step[] list.
 * Shows navigation buttons (Previous, Next, Run All, Reset), a "Step X of N"
 * indicator, a callout box for the current step, and an auto-scrolling step log.
 */
export default function StepViewer({ steps, stepper }: { steps: Step[]; stepper: StepperControls }) {
  const activeItemRef = useRef<HTMLLIElement | null>(null);

  // Keep the newest/highlighted log line visible inside the scrolling log panel.
  useEffect(() => {
    if (activeItemRef.current && typeof activeItemRef.current.scrollIntoView === 'function') {
      activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [stepper.currentStep]);

  if (steps.length === 0) return null;

  const current = steps[stepper.currentStep];
  const visibleSteps = steps.slice(0, stepper.currentStep + 1);

  return (
    <div className="step-viewer">
      <div className="step-header">
        <h3 className="section-title">Step-by-Step Execution</h3>
        <span className="step-counter">
          Step {stepper.currentStep + 1} of {steps.length}
        </span>
      </div>

      <div className="step-controls">
        <button type="button" className="button secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
          Previous
        </button>
        <button type="button" className="button primary" onClick={stepper.next} disabled={stepper.isLast}>
          Next
        </button>
        <button type="button" className="button secondary" onClick={stepper.runAll} disabled={stepper.isLast}>
          Run All
        </button>
        <button type="button" className="button secondary" onClick={stepper.reset} disabled={stepper.isFirst}>
          Reset
        </button>
      </div>

      <div className="current-step-box" aria-live="polite">
        <div className="current-step-title">{current.title}</div>
        <p className="current-step-desc">{current.description}</p>
      </div>

      <div className="step-log-label">Step log ({visibleSteps.length} revealed)</div>
      <ol className="step-log">
        {visibleSteps.map((step, index) => {
          const isCurrent = index === stepper.currentStep;
          return (
            <li
              key={index}
              ref={isCurrent ? activeItemRef : null}
              className={isCurrent ? 'step-log-item current' : 'step-log-item'}
            >
              <strong>{step.title}</strong> — {step.description}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
