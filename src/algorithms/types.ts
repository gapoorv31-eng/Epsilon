// Shared types that EVERY algorithm plugin implements.
// Pure TypeScript: no React or DOM imports.

/**
 * One step of an algorithm, in a generic shape.
 * Because every algorithm uses this same shape, a single step viewer
 * can later display the steps of ANY algorithm.
 */
export interface Step {
  /** Short heading, e.g. "Process {q0,q1} on 'b'". */
  title: string;
  /** Plain-English explanation of what happened in this step. */
  description: string;
  /** Algorithm-specific details (sets, symbols, flags, ...). */
  data: Record<string, unknown>;
}

/** What run() returns: the list of steps plus the final answer. */
export interface RunResult<Result> {
  steps: Step[];
  result: Result;
}

/**
 * The plugin interface. Input is the algorithm's input type (e.g. an NFA),
 * Result is its output type (e.g. a DFA).
 */
export interface Algorithm<Input, Result> {
  /** Unique, URL-friendly id, e.g. "nfa-to-dfa". */
  id: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** One-sentence description of what the algorithm does. */
  description: string;
  /** A ready-made input so users can try the algorithm immediately. */
  exampleInput: Input;
  /** Checks the input. Returns a list of error messages; an empty list means valid. */
  validate(input: Input): string[];
  /** Runs the algorithm on a VALID input and returns its steps and result. */
  run(input: Input): RunResult<Result>;
}

/**
 * Any algorithm, whatever its input/result types.
 * Used by the registry so algorithms with different types can share one list.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAlgorithm = Algorithm<any, any>;
