// Breadth-first Pushdown Automaton (PDA) simulator with loop guards.
// Pure TypeScript: no React or DOM imports.
import type { RunResult, Step } from '../types';
import {
  EPSILON,
  type PDA,
  type PdaConfig,
  type PdaInput,
  type PdaPathEntry,
  type PdaResult,
  type PdaStepData,
  type PdaTransition,
} from './types';

const DEFAULT_MAX_CONFIGURATIONS = 10000;
const DEFAULT_MAX_STACK_HEIGHT = 100;

interface SearchNode {
  config: PdaConfig;
  transition: PdaTransition | null;
  parent: SearchNode | null;
}

/** Builds an unambiguous key for a PDA configuration so no configuration is expanded twice. */
function configKey(config: PdaConfig): string {
  return JSON.stringify([config.state, config.remainingInput, config.stack]);
}

/**
 * Checks whether `config` satisfies the PDA's acceptance condition:
 * - final-state: input is fully consumed and current state is in `accepting`
 * - empty-stack: input is fully consumed and stack is empty (`accepting` is ignored)
 */
function isAcceptingConfig(machine: PDA, acceptingSet: Set<string>, config: PdaConfig): boolean {
  if (config.remainingInput.length > 0) return false;
  if (machine.acceptanceMode === 'final-state') {
    return acceptingSet.has(config.state);
  }
  return config.stack.length === 0;
}

/** Reconstructs the path from the initial configuration to `node`. */
function buildPath(node: SearchNode): PdaPathEntry[] {
  const path: PdaPathEntry[] = [];
  let curr: SearchNode | null = node;
  while (curr !== null) {
    path.push({ config: curr.config, transition: curr.transition });
    curr = curr.parent;
  }
  path.reverse();
  return path;
}

/** Formats a plain-English description for one PDA transition step. */
function formatMoveDescription(prev: PdaConfig, t: PdaTransition): string {
  const inputPart = t.input === EPSILON ? 'Without reading input' : `Read ${t.input}`;
  const stackPart = t.push === '' ? 'pop' : `push ${t.push} on top`;
  const statePart = t.to === prev.state ? `stay in ${t.to}` : `move to ${t.to}`;
  return `${inputPart}, top is ${t.top}: ${stackPart}, ${statePart}.`;
}

/** Converts a PdaPathEntry list into generic Step objects for StepViewer. */
function pathToSteps(path: PdaPathEntry[]): Step[] {
  return path.map((entry, idx) => {
    const { config, transition } = entry;
    const data: PdaStepData = {
      state: config.state,
      remainingInput: config.remainingInput,
      stack: config.stack,
      transition,
    };

    if (idx === 0 || transition === null) {
      const shownInput = config.remainingInput === '' ? EPSILON : config.remainingInput;
      const shownStack = config.stack === '' ? EPSILON : config.stack;
      return {
        title: 'Initial configuration',
        description: `Start in ${config.state} with remaining input "${shownInput}" and stack "${shownStack}".`,
        data,
      };
    }

    const prevConfig = path[idx - 1].config;
    return {
      title: `${transition.from} --(${transition.input}, ${transition.top} / ${transition.push || EPSILON})--> ${transition.to}`,
      description: formatMoveDescription(prevConfig, transition),
      data,
    };
  });
}

/**
 * Simulates a (possibly nondeterministic) PDA on `input.inputString` using BFS.
 * Returns "accepted" if any accepting configuration is reached (even if other branches hit a guard),
 * "rejected" only when all reachable configurations are exhausted without hitting a guard,
 * and "undecided: limit reached" if a guard stops the search before acceptance is found.
 */
export function simulatePda(input: PdaInput): RunResult<PdaResult> {
  const { machine, inputString } = input;
  const maxConfigs = input.maxConfigurations ?? DEFAULT_MAX_CONFIGURATIONS;
  const maxStack = input.maxStackHeight ?? DEFAULT_MAX_STACK_HEIGHT;
  const acceptingSet = new Set(machine.accepting);

  const initial: PdaConfig = {
    state: machine.start,
    remainingInput: inputString,
    stack: machine.initialStackSymbol,
  };

  const root: SearchNode = { config: initial, transition: null, parent: null };
  const visited = new Set<string>([configKey(initial)]);
  const queue: SearchNode[] = [root];

  let exploredCount = 0;
  let limitReached = false;
  // Deepest node (fewest remaining input characters); strict `<` breaks ties by earliest BFS discovery.
  let bestNode: SearchNode = root;

  while (queue.length > 0) {
    if (exploredCount >= maxConfigs) {
      limitReached = true;
      break;
    }

    const curr = queue.shift()!;
    exploredCount++;

    if (curr.config.remainingInput.length < bestNode.config.remainingInput.length) {
      bestNode = curr;
    }

    if (isAcceptingConfig(machine, acceptingSet, curr.config)) {
      const path = buildPath(curr);
      return {
        steps: pathToSteps(path),
        result: { status: 'accepted', reason: 'accepted', exploredCount, path },
      };
    }

    if (curr.config.stack.length === 0) continue;

    const top = curr.config.stack[0];
    const restStack = curr.config.stack.slice(1);
    const nextChar = curr.config.remainingInput[0];

    for (const t of machine.transitions) {
      if (t.from !== curr.config.state || t.top !== top) continue;

      let nextRemaining: string;
      if (t.input === EPSILON) {
        nextRemaining = curr.config.remainingInput;
      } else if (t.input === nextChar) {
        nextRemaining = curr.config.remainingInput.slice(1);
      } else {
        continue;
      }

      const nextStack = t.push + restStack;
      if (nextStack.length > maxStack) {
        limitReached = true;
        continue;
      }

      const nextConfig: PdaConfig = {
        state: t.to,
        remainingInput: nextRemaining,
        stack: nextStack,
      };
      const key = configKey(nextConfig);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ config: nextConfig, transition: t, parent: curr });
      }
    }
  }

  const path = buildPath(bestNode);
  if (limitReached) {
    return {
      steps: pathToSteps(path),
      result: { status: 'undecided', reason: 'undecided: limit reached', exploredCount, path },
    };
  }

  return {
    steps: pathToSteps(path),
    result: { status: 'rejected', reason: 'rejected', exploredCount, path },
  };
}
