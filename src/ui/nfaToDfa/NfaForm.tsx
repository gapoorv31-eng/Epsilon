import { useState } from 'react';
import type { NFA } from '../../algorithms/nfaToDfa';
import type { InputFormProps } from '../types';
import { buildNfa, emptyForm, nfaToForm, parseList, tableColumns, type NfaFormValues } from './formUtils';
import TransitionTable from './TransitionTable';

/**
 * The NFA input form: text fields for states, alphabet, start and accepting states,
 * an automatic transition table, and Load example / Clear / Convert buttons.
 */
export default function NfaForm({ exampleInput, onSubmit, onClear }: InputFormProps<NFA>) {
  const [form, setForm] = useState<NfaFormValues>(emptyForm);

  // The table rows and columns are recomputed from the text on every render.
  const states = parseList(form.states);
  const columns = tableColumns(parseList(form.alphabet));

  // Update one of the four text fields.
  function updateField(field: 'states' | 'alphabet' | 'start' | 'accepting', value: string) {
    setForm({ ...form, [field]: value });
  }

  // Update one table cell. Other cells (even hidden ones) keep their values.
  function updateCell(state: string, symbol: string, value: string) {
    setForm({ ...form, cells: { ...form.cells, [state]: { ...form.cells[state], [symbol]: value } } });
  }

  // Empty the form and tell the page to hide old results.
  function handleClear() {
    setForm(emptyForm);
    onClear();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault(); // stay on the page
        onSubmit(buildNfa(form));
      }}
    >
      <div className="field-grid">
        <TextField id="nfa-states" label="States" placeholder="q0, q1, q2" value={form.states} onChange={(v) => updateField('states', v)} />
        <TextField id="nfa-alphabet" label="Alphabet" placeholder="a, b" value={form.alphabet} onChange={(v) => updateField('alphabet', v)} />
        <TextField id="nfa-start" label="Start state" placeholder="q0" value={form.start} onChange={(v) => updateField('start', v)} />
        <TextField id="nfa-accepting" label="Accepting states" placeholder="q2" value={form.accepting} onChange={(v) => updateField('accepting', v)} />
      </div>

      <h3 className="section-title">Transitions</h3>
      <p className="hint">Each cell: comma-separated target states. Leave empty for "no move".</p>
      <TransitionTable states={states} columns={columns} cells={form.cells} onCellChange={updateCell} />

      <div className="button-row">
        <button type="button" className="button secondary" onClick={() => setForm(nfaToForm(exampleInput))}>
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

/** One labelled text input. */
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
