// Shared types for the UI layer. Every algorithm's UI components follow these shapes.
import type { ComponentType } from 'react';
import type { Step } from '../algorithms/types';

/** Props given to every algorithm's input form. */
export interface InputFormProps<Input> {
  /** The plugin's example input, used by a "Load example" button. */
  exampleInput: Input;
  /** Called with the finished input object when the user submits the form. */
  onSubmit(input: Input): void;
  /** Called when the user clears the form, so the page can hide old results and errors. */
  onClear(): void;
}

/** Props given to every algorithm's result view. */
export interface ResultViewProps<Result> {
  result: Result;
  /** Optional list of steps from run(), used by step-aware result views. */
  steps?: Step[];
  /** Optional 0-based index of the current step in step-by-step mode. */
  currentStep?: number;
}

/** The UI components that belong to one algorithm. */
export interface AlgorithmUI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  InputForm: ComponentType<InputFormProps<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResultView: ComponentType<ResultViewProps<any>>;
  /** Optional UI helper to rewrite step descriptions in clearer plain English. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatSteps?(input: any, steps: Step[], result: any): Step[];
}
