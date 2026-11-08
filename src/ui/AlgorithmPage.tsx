import { useState } from 'react';
import type { AnyAlgorithm, Step } from '../algorithms/types';
import ErrorBox from './ErrorBox';
import StepViewer from './StepViewer';
import { uiRegistry } from './uiRegistry';
import { useStepper } from './useStepper';

/**
 * The generic page for one algorithm. It shows the name and description,
 * renders the algorithm's form, validates the submitted input, shows errors,
 * and runs the algorithm with step-by-step controls and a progressive result view.
 */
export default function AlgorithmPage({ algorithm }: { algorithm: AnyAlgorithm }) {
  const [errors, setErrors] = useState<string[]>([]);
  // Wrapped in an object so "no result yet" (null) is never confused with a real result.
  const [output, setOutput] = useState<{
    input: unknown;
    result: unknown;
    steps: Step[];
    runKey: number;
  } | null>(null);
  const ui = uiRegistry[algorithm.id];
  const stepper = useStepper(output ? output.steps.length : 0);

  // Validate the input; show errors if any, otherwise run the algorithm and start at Step 1.
  function handleSubmit(input: unknown) {
    const messages = algorithm.validate(input);
    setErrors(messages);
    if (messages.length > 0) {
      setOutput(null);
      stepper.reset();
      return;
    }
    const { steps: rawSteps, result } = algorithm.run(input);
    const steps = ui?.formatSteps ? ui.formatSteps(input, rawSteps, result) : rawSteps;
    setOutput((prev) => ({
      input,
      result,
      steps,
      runKey: (prev?.runKey ?? 0) + 1,
    }));
    stepper.reset();
  }

  // Forget old errors, steps, and results when the form is cleared.
  function handleClear() {
    setErrors([]);
    setOutput(null);
    stepper.reset();
  }

  return (
    <section>
      <h2 className="page-title">{algorithm.name}</h2>
      <p className="page-description">{algorithm.description}</p>

      {!ui ? (
        <div className="card coming-soon">UI coming soon for this algorithm.</div>
      ) : (
        <>
          <div className="card">
            <ui.InputForm exampleInput={algorithm.exampleInput} onSubmit={handleSubmit} onClear={handleClear} />
          </div>
          <ErrorBox errors={errors} />
          {output && (
            <>
              <div className="card">
                <StepViewer steps={output.steps} stepper={stepper} />
              </div>
              <div className="card">
                <ui.ResultView
                  result={output.result}
                  input={output.input}
                  runKey={output.runKey}
                  steps={output.steps}
                  currentStep={stepper.currentStep}
                />
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
