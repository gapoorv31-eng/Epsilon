import { useState } from 'react';

/**
 * State and actions returned by useStepper for controlling step-by-step playback.
 */
export interface StepperControls {
  /** Current 0-based step index. */
  currentStep: number;
  /** True when at the very first step (index 0). */
  isFirst: boolean;
  /** True when at the very last step (index totalSteps - 1). */
  isLast: boolean;
  /** Move back one step. */
  prev(): void;
  /** Advance forward one step. */
  next(): void;
  /** Jump straight to the last step. */
  runAll(): void;
  /** Return to the first step (index 0). */
  reset(): void;
}

/**
 * Generic React hook that manages the current step index (0 to totalSteps - 1)
 * and provides Previous, Next, Run All, and Reset actions.
 */
export function useStepper(totalSteps: number): StepperControls {
  const [currentStep, setCurrentStep] = useState(0);
  const lastIndex = Math.max(0, totalSteps - 1);
  const safeStep = Math.min(currentStep, lastIndex);

  return {
    currentStep: safeStep,
    isFirst: safeStep <= 0,
    isLast: safeStep >= lastIndex,
    prev: () => setCurrentStep((step) => Math.max(0, step - 1)),
    next: () => setCurrentStep((step) => Math.min(lastIndex, step + 1)),
    runAll: () => setCurrentStep(lastIndex),
    reset: () => setCurrentStep(0),
  };
}
