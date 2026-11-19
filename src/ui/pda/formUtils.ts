// Helper functions for the PDA input form.
import { EPSILON, type AcceptanceMode, type PdaInput, type PdaTransition } from '../../algorithms/pda';

export interface PdaTransitionRow {
  from: string;
  input: string;
  top: string;
  to: string;
  push: string;
}

export interface PdaFormValues {
  states: string;
  inputAlphabet: string;
  stackAlphabet: string;
  start: string;
  initialStackSymbol: string;
  accepting: string;
  acceptanceMode: AcceptanceMode;
  inputString: string;
  transitions: PdaTransitionRow[];
}

/** An empty PDA form state. */
export const emptyPdaForm: PdaFormValues = {
  states: '',
  inputAlphabet: '',
  stackAlphabet: '',
  start: '',
  initialStackSymbol: '',
  accepting: '',
  acceptanceMode: 'final-state',
  inputString: '',
  transitions: [{ from: '', input: '', top: '', to: '', push: '' }],
};

/** Splits a comma-separated field into unique, trimmed, non-empty tokens. */
export function parseList(text: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of text.split(',')) {
    const trimmed = part.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      items.push(trimmed);
    }
  }
  return items;
}

/** Normalizes a user-entered transition input symbol ("eps" or empty -> "ε"). */
function normalizeInputSymbol(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'eps' || trimmed === EPSILON) return EPSILON;
  return trimmed;
}

/** Normalizes a user-entered push string ("ε" or "eps" -> ""). */
function normalizePushString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'eps' || trimmed === EPSILON) return '';
  return trimmed;
}

/** Converts form values into a PdaInput object for validation and simulation. */
export function buildPdaInput(form: PdaFormValues): PdaInput {
  const transitions: PdaTransition[] = form.transitions
    .filter((row) => row.from.trim() || row.top.trim() || row.to.trim())
    .map((row) => ({
      from: row.from.trim(),
      input: normalizeInputSymbol(row.input),
      top: row.top.trim(),
      to: row.to.trim(),
      push: normalizePushString(row.push),
    }));

  return {
    inputString: form.inputString,
    machine: {
      states: parseList(form.states),
      inputAlphabet: parseList(form.inputAlphabet),
      stackAlphabet: parseList(form.stackAlphabet),
      start: form.start.trim(),
      initialStackSymbol: form.initialStackSymbol.trim(),
      accepting: parseList(form.accepting),
      acceptanceMode: form.acceptanceMode,
      transitions,
    },
  };
}

/** Converts a PdaInput object into form values for "Load example". */
export function pdaInputToForm(input: PdaInput): PdaFormValues {
  const { machine, inputString } = input;
  return {
    states: machine.states.join(', '),
    inputAlphabet: machine.inputAlphabet.join(', '),
    stackAlphabet: machine.stackAlphabet.join(', '),
    start: machine.start,
    initialStackSymbol: machine.initialStackSymbol,
    accepting: machine.accepting.join(', '),
    acceptanceMode: machine.acceptanceMode,
    inputString,
    transitions: machine.transitions.map((t) => ({
      from: t.from,
      input: t.input,
      top: t.top,
      to: t.to,
      push: t.push === '' ? EPSILON : t.push,
    })),
  };
}
