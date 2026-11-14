import { useState } from 'react';
import { runValidationCases, type ValidationReport } from './validationCases';

/**
 * Built-in validation panel for the NFA to DFA page.
 * Always visible on the page so the user or examiner can run all 8 built-in
 * verification cases with one click and inspect expected vs. actual results.
 */
export default function ValidationPanel() {
  const [report, setReport] = useState<ValidationReport | null>(null);

  // Run all built-in validation cases and store the report.
  function handleRun() {
    setReport(runValidationCases());
  }

  const allPassed = report ? report.passedCount === report.totalCount : false;

  return (
    <div className="validation-panel">
      <div className="validation-header">
        <div>
          <h3 className="section-title">Algorithm Validation Suite</h3>
          <p className="hint">
            Runs 8 built-in NFA test cases against hand-written expectations and checks NFA/DFA agreement on all strings up to length 5.
          </p>
        </div>
        <button type="button" className="button secondary" onClick={handleRun}>
          Run validation tests
        </button>
      </div>

      {report && (
        <>
          <div className="validation-summary-bar">
            <span className="summary">
              {report.passedCount} of {report.totalCount} passed
            </span>
            <span className={allPassed ? 'badge badge-pass' : 'badge badge-fail'}>
              {allPassed ? 'ALL PASSED' : 'FAILURES DETECTED'}
            </span>
          </div>

          <div className="table-scroll">
            <table className="table validation-table">
              <thead>
                <tr>
                  <th>Test name</th>
                  <th>What it checks</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((item) => (
                  <tr key={item.name} className={item.passed ? undefined : 'validation-fail-row'}>
                    <th scope="row">{item.name}</th>
                    <td className="validation-desc-cell">{item.description}</td>
                    <td className="validation-detail-cell">{item.expectedText}</td>
                    <td className="validation-detail-cell">{item.actualText}</td>
                    <td>
                      <span className={item.passed ? 'badge badge-pass' : 'badge badge-fail'}>
                        {item.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
