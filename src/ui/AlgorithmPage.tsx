import { useState } from 'react';
import type { AnyAlgorithm } from '../algorithms/types';
import ErrorBox from './ErrorBox';
import { uiRegistry } from './uiRegistry';

/**
 * The generic page for one algorithm. It shows the name and description,
 * renders the algorithm's form, validates the submitted input, shows errors,
 * and runs the algorithm to display its result.
 */
export default function AlgorithmPage({ algorithm }: { algorithm: AnyAlgorithm }) {
  const [errors, setErrors] = useState<string[]>([]);
  // Wrapped in an object so "no result yet" (null) is never confused with a real result.
  const [output, setOutput] = useState<{ result: unknown } | null>(null);
  const ui = uiRegistry[algorithm.id];

  // Validate the input; show errors if any, otherwise run the algorithm and keep its result.
  function handleSubmit(input: unknown) {
    const messages = algorithm.validate(input);
    setErrors(messages);
    if (messages.length > 0) {
      setOutput(null);
      return;
    }
    const { result } = algorithm.run(input); // steps are used in a later phase
    setOutput({ result });
  }

  // Forget old errors and results when the form is cleared.
  function handleClear() {
    setErrors([]);
    setOutput(null);
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
            <div className="card">
              <ui.ResultView result={output.result} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
