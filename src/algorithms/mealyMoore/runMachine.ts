// Runs a Mealy or Moore machine on an input symbol sequence.
// Pure TypeScript: no React or DOM imports.
import type { TransducerMachine } from './types';

export interface TransducerRunResult {
  /** Output sequence aligned with input symbols (for Moore, excludes the initial start-state output). */
  outputs: string[];
  /** Full output sequence (for Moore, includes the initial start-state output at index 0). */
  fullOutputs: string[];
  /** Sequence of states visited, starting at machine.start. */
  statesVisited: string[];
}

/**
 * Executes a Mealy or Moore machine on `symbols` (an array of input alphabet tokens).
 * For Moore machines, `outputs` omits the initial start-state output while `fullOutputs` includes it.
 */
export function runTransducer(machine: TransducerMachine, symbols: string[]): TransducerRunResult {
  let current = machine.start;
  const statesVisited = [current];
  const outputs: string[] = [];
  const fullOutputs: string[] = machine.kind === 'moore' ? [machine.outputs[current]] : [];

  for (const sym of symbols) {
    if (machine.kind === 'mealy') {
      const move = machine.transitions[current][sym];
      current = move.nextState;
      outputs.push(move.output);
      fullOutputs.push(move.output);
    } else {
      const nextState = machine.transitions[current][sym];
      current = nextState;
      const out = machine.outputs[current];
      outputs.push(out);
      fullOutputs.push(out);
    }
    statesVisited.push(current);
  }

  return { outputs, fullOutputs, statesVisited };
}
