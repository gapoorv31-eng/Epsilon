// Shared types for the UI layer. Every algorithm's UI components follow these shapes.
import type { ComponentType } from 'react';

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
}

/** The UI components that belong to one algorithm. */
export interface AlgorithmUI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  InputForm: ComponentType<InputFormProps<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResultView: ComponentType<ResultViewProps<any>>;
}
