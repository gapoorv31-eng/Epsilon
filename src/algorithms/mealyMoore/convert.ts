// Mealy <-> Moore conversion algorithms.
// Pure TypeScript: no React or DOM imports.
import type { RunResult, Step } from '../types';
import type {
  MealyMachine,
  MealyMooreInput,
  MealyMooreResult,
  MealyToMooreStepData,
  MooreMachine,
  MooreToMealyStepData,
} from './types';

/** Builds an unambiguous internal key for a (state, output) pair, safe for "/" or "," in names. */
function pairKey(state: string, output: string): string {
  return JSON.stringify([state, output]);
}

/** Allocates a readable, collision-free display name like "A/0" for a (state, output) pair. */
function allocatePairName(state: string, output: string, usedNames: Set<string>): string {
  const base = `${state}/${output}`;
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }
  let suffix = 2;
  while (usedNames.has(`${base} (${suffix})`)) {
    suffix++;
  }
  const unique = `${base} (${suffix})`;
  usedNames.add(unique);
  return unique;
}

/** Converts a Mealy machine into an equivalent Moore machine using BFS from (start, defaultStartOutput). */
export function mealyToMoore(
  mealy: MealyMachine,
  defaultStartOutput?: string
): RunResult<MooreMachine> {
  const startOut =
    defaultStartOutput && defaultStartOutput !== '' ? defaultStartOutput : mealy.outputAlphabet[0];

  const steps: Step[] = [];
  const usedNames = new Set<string>();
  const keyToName = new Map<string, string>();
  const states: string[] = [];
  const outputs: Record<string, string> = {};
  const transitions: Record<string, Record<string, string>> = {};

  interface QueueItem {
    state: string;
    output: string;
    name: string;
  }

  const startKey = pairKey(mealy.start, startOut);
  const startName = allocatePairName(mealy.start, startOut, usedNames);
  keyToName.set(startKey, startName);
  states.push(startName);
  outputs[startName] = startOut;
  transitions[startName] = {};

  const startData: MealyToMooreStepData = {
    kind: 'mealy-to-moore',
    phase: 'create-state',
    stateName: startName,
    originalState: mealy.start,
    output: startOut,
    isNew: true,
  };
  steps.push({
    title: `Create start state ${startName}`,
    description: `Start at (${mealy.start}, ${startOut}) named ${startName} with Moore output '${startOut}'.`,
    data: startData,
  });

  const queue: QueueItem[] = [{ state: mealy.start, output: startOut, name: startName }];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const sym of mealy.inputAlphabet) {
      const move = mealy.transitions[curr.state][sym];
      const targetKey = pairKey(move.nextState, move.output);
      const isNew = !keyToName.has(targetKey);

      let targetName = keyToName.get(targetKey);
      if (!targetName) {
        targetName = allocatePairName(move.nextState, move.output, usedNames);
        keyToName.set(targetKey, targetName);
        states.push(targetName);
        outputs[targetName] = move.output;
        transitions[targetName] = {};
        queue.push({ state: move.nextState, output: move.output, name: targetName });

        const createData: MealyToMooreStepData = {
          kind: 'mealy-to-moore',
          phase: 'create-state',
          stateName: targetName,
          originalState: move.nextState,
          output: move.output,
          isNew: true,
        };
        steps.push({
          title: `Create state ${targetName}`,
          description: `Discovered new pair (${move.nextState}, ${move.output}) -> created Moore state ${targetName} with output '${move.output}'.`,
          data: createData,
        });
      }

      transitions[curr.name][sym] = targetName;

      const transData: MealyToMooreStepData = {
        kind: 'mealy-to-moore',
        phase: 'transition',
        stateName: targetName,
        originalState: move.nextState,
        output: move.output,
        isNew,
        from: curr.name,
        symbol: sym,
        to: targetName,
      };
      steps.push({
        title: `${curr.name} --${sym}--> ${targetName}`,
        description: `From ${curr.name} on '${sym}': Mealy goes to ${move.nextState} with output '${move.output}', so Moore transitions to ${targetName} (${isNew ? 'new pair' : 'already exists'}).`,
        data: transData,
      });
    }
  }

  return {
    steps,
    result: {
      kind: 'moore',
      states,
      inputAlphabet: [...mealy.inputAlphabet],
      outputAlphabet: [...mealy.outputAlphabet],
      start: startName,
      transitions,
      outputs,
    },
  };
}

/** Converts a Moore machine into an equivalent Mealy machine with the same states. */
export function mooreToMealy(moore: MooreMachine): RunResult<MealyMachine> {
  const steps: Step[] = [];
  const transitions: MealyMachine['transitions'] = {};
  const startOutput = moore.outputs[moore.start];

  for (const state of moore.states) {
    transitions[state] = {};
    for (const sym of moore.inputAlphabet) {
      const nextState = moore.transitions[state][sym];
      const output = moore.outputs[nextState];
      transitions[state][sym] = { nextState, output };

      const baseDesc = `From ${state} on '${sym}': Moore moves to ${nextState} (output '${output}'), so Mealy transitions ${state} --${sym}/${output}--> ${nextState}.`;
      const description =
        steps.length === 0
          ? `Note: Moore start state '${moore.start}' emits '${startOutput}' before any input, which has no Mealy equivalent. ${baseDesc}`
          : baseDesc;

      const data: MooreToMealyStepData = {
        kind: 'moore-to-mealy',
        from: state,
        symbol: sym,
        to: nextState,
        output,
      };
      steps.push({
        title: `${state} --${sym}/${output}--> ${nextState}`,
        description,
        data,
      });
    }
  }

  return {
    steps,
    result: {
      kind: 'mealy',
      states: [...moore.states],
      inputAlphabet: [...moore.inputAlphabet],
      outputAlphabet: [...moore.outputAlphabet],
      start: moore.start,
      transitions,
    },
  };
}

/** Runs either Mealy -> Moore or Moore -> Mealy depending on `input.direction`. */
export function convertMealyMoore(input: MealyMooreInput): RunResult<MealyMooreResult> {
  if (input.direction === 'mealy-to-moore') {
    return mealyToMoore(input.machine as MealyMachine, input.defaultStartOutput);
  }
  return mooreToMealy(input.machine as MooreMachine);
}
