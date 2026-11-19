import { useState } from 'react';
import type { AcceptanceMode, PdaInput } from '../../algorithms/pda';
import type { InputFormProps } from '../types';
import {
  buildPdaInput,
  emptyPdaForm,
  pdaInputToForm,
  type PdaFormValues,
  type PdaTransitionRow,
} from './formUtils';

/**
 * Input form for the Pushdown Automaton Simulator: machine fields, acceptance mode,
 * input string, dynamic transition table (add/remove rows), and Load example / Clear / Run buttons.
 */
export default function PdaForm({ exampleInput, onSubmit, onClear }: InputFormProps<PdaInput>) {
  const [form, setForm] = useState<PdaFormValues>(emptyPdaForm);

  /** Updates a scalar text field. */
  function updateField(
    field:
      | 'states'
      | 'inputAlphabet'
      | 'stackAlphabet'
      | 'start'
      | 'initialStackSymbol'
      | 'accepting'
      | 'inputString',
    value: string
  ) {
    setForm({ ...form, [field]: value });
  }

  /** Updates one cell of a transition row. */
  function updateRow(index: number, field: keyof PdaTransitionRow, value: string) {
    const next = form.transitions.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    setForm({ ...form, transitions: next });
  }

  /** Appends a blank transition row. */
  function addRow() {
    setForm({
      ...form,
      transitions: [...form.transitions, { from: '', input: '', top: '', to: '', push: '' }],
    });
  }

  /** Removes a transition row by index. */
  function removeRow(index: number) {
    const next = form.transitions.filter((_, i) => i !== index);
    setForm({
      ...form,
      transitions: next.length > 0 ? next : [{ from: '', input: '', top: '', to: '', push: '' }],
    });
  }

  /** Clears the form and hides old results. */
  function handleClear() {
    setForm(emptyPdaForm);
    onClear();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(buildPdaInput(form));
      }}
    >
      <div className="field-grid">
        <TextField
          id="pda-states"
          label="States"
          placeholder="q0, q1, q2"
          value={form.states}
          onChange={(v) => updateField('states', v)}
        />
        <TextField
          id="pda-input-alpha"
          label="Input alphabet (single characters)"
          placeholder="a, b"
          value={form.inputAlphabet}
          onChange={(v) => updateField('inputAlphabet', v)}
        />
        <TextField
          id="pda-stack-alpha"
          label="Stack alphabet (single characters)"
          placeholder="Z, A"
          value={form.stackAlphabet}
          onChange={(v) => updateField('stackAlphabet', v)}
        />
        <TextField
          id="pda-start"
          label="Start state"
          placeholder="q0"
          value={form.start}
          onChange={(v) => updateField('start', v)}
        />
        <TextField
          id="pda-init-stack"
          label="Initial stack symbol"
          placeholder="Z"
          value={form.initialStackSymbol}
          onChange={(v) => updateField('initialStackSymbol', v)}
        />
        <TextField
          id="pda-accepting"
          label="Accepting states"
          placeholder="q2"
          value={form.accepting}
          onChange={(v) => updateField('accepting', v)}
        />
        <div className="field">
          <label htmlFor="pda-mode">Acceptance mode</label>
          <select
            id="pda-mode"
            className="mm-select"
            value={form.acceptanceMode}
            onChange={(e) => setForm({ ...form, acceptanceMode: e.target.value as AcceptanceMode })}
          >
            <option value="final-state">Final state</option>
            <option value="empty-stack">Empty stack</option>
          </select>
        </div>
        <TextField
          id="pda-input-string"
          label="Input string"
          placeholder="aabb (leave empty for ε)"
          value={form.inputString}
          onChange={(v) => updateField('inputString', v)}
        />
      </div>

      <h3 className="section-title">Transitions</h3>
      <p className="hint">
        All input and stack symbols must be single characters. Write <code>ε</code> (or <code>eps</code>) for
        epsilon input or pop-only push. Push is written top-first (e.g. <code>AZ</code> puts <code>A</code> on top
        of <code>Z</code>).
      </p>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>From</th>
              <th>Input (or ε)</th>
              <th>Stack Top</th>
              <th>To</th>
              <th>Push (top-first)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {form.transitions.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="pda-cell-input"
                    aria-label={`Transition ${idx + 1} from`}
                    placeholder="q0"
                    value={row.from}
                    onChange={(e) => updateRow(idx, 'from', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="pda-cell-input"
                    aria-label={`Transition ${idx + 1} input`}
                    placeholder="a or ε"
                    value={row.input}
                    onChange={(e) => updateRow(idx, 'input', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="pda-cell-input"
                    aria-label={`Transition ${idx + 1} top`}
                    placeholder="Z"
                    value={row.top}
                    onChange={(e) => updateRow(idx, 'top', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="pda-cell-input"
                    aria-label={`Transition ${idx + 1} to`}
                    placeholder="q0"
                    value={row.to}
                    onChange={(e) => updateRow(idx, 'to', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="pda-cell-input"
                    aria-label={`Transition ${idx + 1} push`}
                    placeholder="AZ or ε"
                    value={row.push}
                    onChange={(e) => updateRow(idx, 'push', e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" className="button secondary pda-remove-btn" onClick={() => removeRow(idx)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-row">
        <button type="button" className="button secondary" onClick={addRow}>
          + Add transition
        </button>
        <button type="button" className="button secondary" onClick={() => setForm(pdaInputToForm(exampleInput))}>
          Load example
        </button>
        <button type="button" className="button secondary" onClick={handleClear}>
          Clear
        </button>
        <button type="submit" className="button primary">
          Run
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
