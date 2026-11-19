// Data types for the Pushdown Automaton (PDA) Simulator plugin.

export const EPSILON = 'ε';

export type AcceptanceMode = 'final-state' | 'empty-stack';
export type PdaStatus = 'accepted' | 'rejected' | 'undecided';

export interface PdaTransition {
  from: string;
  /** Single input character or 'ε'. */
  input: string;
  /** Single stack symbol expected at the top of the stack. */
  top: string;
  to: string;
  /** Top-first replacement string pushed after popping `top` ('' means pop only). */
  push: string;
}

export interface PDA {
  states: string[];
  inputAlphabet: string[];
  stackAlphabet: string[];
  start: string;
  initialStackSymbol: string;
  accepting: string[];
  acceptanceMode: AcceptanceMode;
  transitions: PdaTransition[];
}

export interface PdaInput {
  machine: PDA;
  inputString: string;
  maxConfigurations?: number;
  maxStackHeight?: number;
}

export interface PdaConfig {
  state: string;
  remainingInput: string;
  /** Stack contents written top-first (e.g. "AAZ"). */
  stack: string;
}

export interface PdaPathEntry {
  config: PdaConfig;
  transition: PdaTransition | null;
}

export interface PdaResult {
  status: PdaStatus;
  /** "accepted", "rejected", or "undecided: limit reached". */
  reason: string;
  exploredCount: number;
  path: PdaPathEntry[];
}

export interface PdaStepData {
  state: string;
  remainingInput: string;
  stack: string;
  transition: PdaTransition | null;
  [key: string]: unknown;
}
