// Data types for the Mealy and Moore Conversion plugin.

export type ConversionDirection = 'mealy-to-moore' | 'moore-to-mealy';

export interface MealyTransition {
  nextState: string;
  output: string;
}

export interface MealyMachine {
  kind: 'mealy';
  states: string[];
  inputAlphabet: string[];
  outputAlphabet: string[];
  start: string;
  /** transitions[state][inputSymbol] -> { nextState, output } */
  transitions: Record<string, Record<string, MealyTransition>>;
}

export interface MooreMachine {
  kind: 'moore';
  states: string[];
  inputAlphabet: string[];
  outputAlphabet: string[];
  start: string;
  /** transitions[state][inputSymbol] -> nextState */
  transitions: Record<string, Record<string, string>>;
  /** outputs[state] -> output symbol */
  outputs: Record<string, string>;
}

export type TransducerMachine = MealyMachine | MooreMachine;

export interface MealyMooreInput {
  direction: ConversionDirection;
  machine: TransducerMachine;
  /** Used for mealy-to-moore start state (q0, d); defaults to machine.outputAlphabet[0]. */
  defaultStartOutput?: string;
}

export type MealyMooreResult = MooreMachine | MealyMachine;

export interface MealyToMooreStepData {
  kind: 'mealy-to-moore';
  phase: 'create-state' | 'transition';
  stateName: string;
  originalState: string;
  output: string;
  isNew: boolean;
  from?: string;
  symbol?: string;
  to?: string;
  [key: string]: unknown;
}

export interface MooreToMealyStepData {
  kind: 'moore-to-mealy';
  from: string;
  symbol: string;
  to: string;
  output: string;
  [key: string]: unknown;
}
