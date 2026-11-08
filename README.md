# Epsilon

A toolkit for the Automata Theory course (CSET302) that simulates Automata Theory algorithms step by step.

**Phase 1:** project setup, plugin architecture, and the first algorithm: **NFA → DFA (subset construction)**.

## Running

```bash
npm install     # install dependencies (once)
npm run dev     # start the app (lists the registered algorithms)
npm test        # run the Vitest tests
```

## Architecture

```
src/
├── main.tsx, App.tsx       # React (UI only)
└── algorithms/             # pure TypeScript, no React/DOM
    ├── types.ts            # shared Algorithm + Step interfaces
    ├── registry.ts         # list of all algorithms
    └── nfaToDfa/           # one folder per algorithm ("plugin")
```

- **Every algorithm is a plugin** in its own folder `src/algorithms/<name>/`.
- **Every plugin implements `Algorithm<Input, Result>`** from `src/algorithms/types.ts`:
  - `id`, `name`, `description`, `exampleInput`
  - `validate(input)` → list of error messages (empty = valid)
  - `run(input)` → `{ steps, result }`
- **Steps are generic:** `{ title, description, data }`. Because all algorithms use this shape, one step viewer can show steps from any algorithm.
- **The registry** (`src/algorithms/registry.ts`) is the only place the app learns about algorithms.
- **Algorithm code is pure TypeScript** (no React or DOM imports), so it can be tested and explained on its own.

### The NFA → DFA plugin (`src/algorithms/nfaToDfa/`)

| File | Purpose |
|------|---------|
| `types.ts` | `NFA`, `DFA`, `DFAState` types; `EPSILON = 'ε'`, `DEAD_STATE = '∅'` |
| `nfa.ts` | `epsilonClosure`, `move`, `nfaAccepts` |
| `validate.ts` | `validateNfa` – checks the input NFA |
| `subsetConstruction.ts` | BFS subset construction with steps, `dfaAccepts` |
| `example.ts` | example NFA (strings ending in "ab") |
| `index.ts` | the plugin object that implements `Algorithm<NFA, DFA>` |
| `nfaToDfa.test.ts` | tests |

## How to add a new algorithm

Example: DFA minimization.

1. **Create a folder:** `src/algorithms/dfaMinimization/`.
2. **Write the logic in pure TypeScript** (no React imports): define the input/result types, a `validate` function that returns `string[]`, and a function that returns `{ steps, result }`, where each step is `{ title, description, data }`.
3. **Create `index.ts`** that exports the plugin object:
   ```ts
   import type { Algorithm } from '../types';
   export const dfaMinimization: Algorithm<MyInput, MyResult> = {
     id: 'dfa-minimization',
     name: 'DFA Minimization',
     description: 'Merges equivalent states of a DFA.',
     exampleInput: /* an example input */,
     validate: validateMyInput,
     run: minimize,
   };
   ```
4. **Add one line to `src/algorithms/registry.ts`:**
   ```ts
   import { dfaMinimization } from './dfaMinimization';
   export const algorithms: AnyAlgorithm[] = [
     nfaToDfa,
     dfaMinimization, // ← new line
   ];
   ```
5. **Add tests** in `src/algorithms/dfaMinimization/dfaMinimization.test.ts`. `npm test` picks them up automatically.

You don't need to change anything else.
