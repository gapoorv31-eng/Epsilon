import { useState } from 'react';
import type { ConversionDirection, MealyMooreInput } from '../../algorithms/mealyMoore';
import type { InputFormProps } from '../types';
import {
  buildMealyMooreInput,
  emptyMealyMooreForm,
  inputToMealyMooreForm,
  parseList,
  type MealyMooreFormValues,
} from './formUtils';

/**
 * Input form for Mealy and Moore Conversion: direction selector, alphabet/state fields,
 * automatic transition table (preserving typed values across edits), and action buttons.
 */
export default function MealyMooreForm({
  exampleInput,
  onSubmit,
  onClear,
}: InputFormProps<MealyMooreInput>) {
  const [form, setForm] = useState<MealyMooreFormValues>(emptyMealyMooreForm);

  const states = parseList(form.states);
  const inputAlphabet = parseList(form.inputAlphabet);
  const isMealyToMoore = form.direction === 'mealy-to-moore';

  /** Updates a top-level text field. */
  function updateField(
    field: 'states' | 'inputAlphabet' | 'outputAlphabet' | 'start' | 'defaultStartOutput',
    value: string
  ) {
    setForm({ ...form, [field]: value });
  }

  /** Switches conversion direction while keeping entered table/state values. */
  function handleDirectionChange(direction: ConversionDirection) {
    setForm({ ...form, direction });
  }

  /** Updates one cell's nextState or output without erasing other cells. */
  function updateCell(state: string, symbol: string, part: 'nextState' | 'output', value: string) {
    const prevRow = form.cells[state] ?? {};
    const prevCell = prevRow[symbol] ?? { nextState: '', output: '' };
    setForm({
      ...form,
      cells: {
        ...form.cells,
        [state]: {
          ...prevRow,
          [symbol]: { ...prevCell, [part]: value },
        },
      },
    });
  }

  /** Updates a state's Moore output value. */
  function updateMooreOutput(state: string, value: string) {
    setForm({
      ...form,
      mooreOutputs: { ...form.mooreOutputs, [state]: value },
    });
  }

  /** Clears the form and notifies the page to hide old results. */
  function handleClear() {
    setForm(emptyMealyMooreForm);
    onClear();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(buildMealyMooreInput(form));
      }}
    >
      <div className="field mm-direction-row">
        <label htmlFor="mm-direction">Conversion Direction</label>
        <select
          id="mm-direction"
          className="mm-select"
          value={form.direction}
          onChange={(e) => handleDirectionChange(e.target.value as ConversionDirection)}
        >
          <option value="mealy-to-moore">Mealy → Moore</option>
          <option value="moore-to-mealy">Moore → Mealy</option>
        </select>
      </div>

      <div className="field-grid">
        <TextField
          id="mm-states"
          label="States"
          placeholder="A, B"
          value={form.states}
          onChange={(v) => updateField('states', v)}
        />
        <TextField
          id="mm-input-alphabet"
          label="Input alphabet"
          placeholder="0, 1"
          value={form.inputAlphabet}
          onChange={(v) => updateField('inputAlphabet', v)}
        />
        <TextField
          id="mm-output-alphabet"
          label="Output alphabet"
          placeholder="0, 1"
          value={form.outputAlphabet}
          onChange={(v) => updateField('outputAlphabet', v)}
        />
        <TextField
          id="mm-start"
          label="Start state"
          placeholder="A"
          value={form.start}
          onChange={(v) => updateField('start', v)}
        />
        {isMealyToMoore && (
          <TextField
            id="mm-default-start-output"
            label="Default start output"
            placeholder="0 (defaults to first output)"
            value={form.defaultStartOutput}
            onChange={(v) => updateField('defaultStartOutput', v)}
          />
        )}
      </div>

      <h3 className="section-title">Transition Table</h3>
      <p className="hint">
        {isMealyToMoore
          ? 'Complete machine: enter the next state and output for every (state, input) pair.'
          : 'Complete machine: enter the next state for every (state, input) pair and each state’s Moore output.'}
      </p>

      {states.length === 0 || inputAlphabet.length === 0 ? (
        <p className="hint">Enter at least one state and one input symbol to edit the table.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>State</th>
                {inputAlphabet.map((sym) => (
                  <th key={sym}>On &apos;{sym}&apos;</th>
                ))}
                {!isMealyToMoore && <th>Moore Output</th>}
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state}>
                  <th scope="row">{state}</th>
                  {inputAlphabet.map((sym) => {
                    const cell = form.cells[state]?.[sym] ?? { nextState: '', output: '' };
                    return (
                      <td key={sym}>
                        {isMealyToMoore ? (
                          <div className="mm-cell-pair">
                            <input
                              type="text"
                              className="mm-cell-input"
                              aria-label={`${state} on ${sym} next state`}
                              placeholder="next"
                              value={cell.nextState}
                              onChange={(e) => updateCell(state, sym, 'nextState', e.target.value)}
                            />
                            <span className="mm-slash">/</span>
                            <input
                              type="text"
                              className="mm-cell-input"
                              aria-label={`${state} on ${sym} output`}
                              placeholder="out"
                              value={cell.output}
                              onChange={(e) => updateCell(state, sym, 'output', e.target.value)}
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="cell-input"
                            aria-label={`${state} on ${sym} next state`}
                            placeholder="next"
                            value={cell.nextState}
                            onChange={(e) => updateCell(state, sym, 'nextState', e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                  {!isMealyToMoore && (
                    <td>
                      <input
                        type="text"
                        className="cell-input"
                        aria-label={`Moore output for ${state}`}
                        placeholder="out"
                        value={form.mooreOutputs[state] ?? ''}
                        onChange={(e) => updateMooreOutput(state, e.target.value)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="button-row">
        <button
          type="button"
          className="button secondary"
          onClick={() => setForm(inputToMealyMooreForm(exampleInput))}
        >
          Load example
        </button>
        <button type="button" className="button secondary" onClick={handleClear}>
          Clear
        </button>
        <button type="submit" className="button primary">
          Convert
        </button>
      </div>
    </form>
  );
}

/** One labelled text input field. */
function TextField(props: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        type="text"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
