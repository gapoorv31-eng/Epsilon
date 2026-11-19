// Builds progressive table and graph state from Mealy/Moore conversion steps.
import type {
  MealyMachine,
  MealyMooreResult,
  MealyToMooreStepData,
  MooreMachine,
  MooreToMealyStepData,
} from '../../algorithms/mealyMoore';
import type { Step } from '../../algorithms/types';

export interface PartialConvertedMachine {
  /** States revealed so far. */
  revealedStates: string[];
  /** Revealed transitions: cells[from][symbol] = { nextState, output }. */
  revealedCells: Record<string, Record<string, { nextState: string; output?: string }>>;
  /** State currently being processed or highlighted. */
  activeFrom?: string;
  /** Input symbol currently being processed. */
  activeSymbol?: string;
  /** State newly created in the current step. */
  newlyCreated?: string;
}

/**
 * Replays `steps[0 .. currentStep]` to determine which states and transitions
 * of the converted machine should be visible at `currentStep`.
 */
export function buildPartialMachine(
  steps: Step[],
  currentStep: number,
  result: MealyMooreResult
): PartialConvertedMachine {
  const revealedStates: string[] = [];
  const revealedSet = new Set<string>();
  const revealedCells: Record<string, Record<string, { nextState: string; output?: string }>> = {};

  let activeFrom: string | undefined;
  let activeSymbol: string | undefined;
  let newlyCreated: string | undefined;

  if (result.kind === 'moore') {
    const moore = result as MooreMachine;
    const limit = Math.min(currentStep, steps.length - 1);
    for (let i = 0; i <= limit; i++) {
      const data = steps[i].data as MealyToMooreStepData;
      const isLast = i === limit;

      if (data.phase === 'create-state') {
        if (!revealedSet.has(data.stateName)) {
          revealedSet.add(data.stateName);
          revealedStates.push(data.stateName);
          revealedCells[data.stateName] = {};
        }
        if (isLast) {
          newlyCreated = data.stateName;
          activeFrom = data.stateName;
          activeSymbol = undefined;
        }
      } else if (data.phase === 'transition' && data.from && data.symbol && data.to) {
        if (!revealedSet.has(data.from)) {
          revealedSet.add(data.from);
          revealedStates.push(data.from);
          revealedCells[data.from] = {};
        }
        revealedCells[data.from][data.symbol] = { nextState: data.to };
        if (isLast) {
          activeFrom = data.from;
          activeSymbol = data.symbol;
          newlyCreated = undefined;
        }
      }
    }
    // Preserve result state order for revealed states.
    const ordered = moore.states.filter((s) => revealedSet.has(s));
    return { revealedStates: ordered, revealedCells, activeFrom, activeSymbol, newlyCreated };
  }

  // Moore -> Mealy: all states exist from the start; each step reveals one (state, symbol) cell.
  const mealy = result as MealyMachine;
  for (const s of mealy.states) {
    revealedStates.push(s);
    revealedSet.add(s);
    revealedCells[s] = {};
  }

  const limit = Math.min(currentStep, steps.length - 1);
  for (let i = 0; i <= limit; i++) {
    const data = steps[i].data as MooreToMealyStepData;
    revealedCells[data.from][data.symbol] = { nextState: data.to, output: data.output };
    if (i === limit) {
      activeFrom = data.from;
      activeSymbol = data.symbol;
    }
  }

  return { revealedStates, revealedCells, activeFrom, activeSymbol };
}
