# Epsilon – Viva Guide (EXPLANATION.md)

This guide is for team members who must explain the code in a viva. Every file and function name below was checked against the source code in this repository. Wherever something could not be verified, it is marked **(not verified)**.

---

## 1. File-by-File Tour

### Root files

| File | What it does |
|---|---|
| `index.html` | The single HTML page. Contains `<div id="root">`, the page title, and an inline SVG "ε" favicon (a data URI, so no image file is needed). |
| `package.json` | Scripts: `dev` (`vite`), `build` (`tsc --noEmit && vite build`), `preview` (`vite preview`), `test` (`vitest run`). |
| `vite.config.ts` | Vite + Vitest configuration. `base` is `'/Epsilon/'` for production builds (GitHub Pages) and `'/'` for `npm run dev`. Vitest only runs `src/**/*.test.ts`. |
| `tsconfig.json` | Strict TypeScript settings, including `noUnusedLocals` and `noUnusedParameters`. |
| `.github/workflows/deploy.yml` | GitHub Actions workflow: on every push to `main` it runs `npm ci`, `npm test`, `npm run build`, and deploys `dist/` to GitHub Pages. |

### `src/` entry points

| File | What it does |
|---|---|
| `src/main.tsx` | Mounts `<App />` inside `<StrictMode>` into `#root` and imports `ui/styles.css`. |
| `src/App.tsx` | The root component. It only renders `<AppShell />`. |

### `src/algorithms/` – pure TypeScript (no React, no DOM)

| File | What it does |
|---|---|
| `types.ts` | Shared interfaces: `Step` (`title`, `description`, `data`), `RunResult<Result>` (`steps`, `result`), `Algorithm<Input, Result>` (`id`, `name`, `description`, `exampleInput`, `validate`, `run`), and `AnyAlgorithm`. |
| `registry.ts` | `export const algorithms: AnyAlgorithm[] = [nfaToDfa];` – the list of all algorithms. |
| `nfaToDfa/types.ts` | Constants `EPSILON = 'ε'` and `DEAD_STATE = '∅'`; interfaces `NFA`, `DFAState`, `DFA`. |
| `nfaToDfa/nfa.ts` | `epsilonClosure`, `move`, `nfaAccepts`, and `sortStates`. |
| `nfaToDfa/validate.ts` | `validateNfa(nfa)` – returns a list of error messages (empty list = valid). |
| `nfaToDfa/subsetConstruction.ts` | `setName`, `subsetConstruction` (the algorithm), and `dfaAccepts`. |
| `nfaToDfa/example.ts` | `endsInAbNfa` – the example NFA for strings ending in "ab". |
| `nfaToDfa/index.ts` | The plugin object `nfaToDfa: Algorithm<NFA, DFA>` (with `validate: validateNfa`, `run: subsetConstruction`), plus re-exports of `epsilonClosure`, `move`, `nfaAccepts`, `dfaAccepts`, `setName`, and all types. |
| `nfaToDfa/nfaToDfa.test.ts` | 11 Vitest tests for the algorithm (including NFA/DFA agreement on all strings up to length 6). |

### `src/ui/` – generic React layer

| File | What it does |
|---|---|
| `types.ts` | `InputFormProps<Input>`, `ResultViewProps<Result, Input>` (with optional `input`, `runKey`, `steps`, `currentStep`), and `AlgorithmUI` (`InputForm`, `ResultView`, optional `ExtraResultCard`, `ValidationPanel`, `formatSteps`). |
| `uiRegistry.ts` | Maps the id `'nfa-to-dfa'` to `NfaForm`, `DfaResultView`, `StringTester`, `ValidationPanel`, and `formatNfaSteps`. |
| `AppShell.tsx` | Header, a sidebar built from `algorithms`, the main area (`AlgorithmPage`), and the course footer. |
| `AlgorithmPage.tsx` | Generic page: calls `algorithm.validate`, shows `ErrorBox`, calls `algorithm.run`, applies `ui.formatSteps`, keeps `output` (`input`, `result`, `steps`, `runKey`), and renders `StepViewer`, `ResultView`, `ExtraResultCard`, and `ValidationPanel`. Shows "UI coming soon for this algorithm." if no UI is registered. |
| `ErrorBox.tsx` | Red box listing error messages; renders nothing when there are none. |
| `useStepper.ts` | Hook `useStepper(totalSteps)` that returns `currentStep`, `isFirst`, `isLast`, `prev`, `next`, `runAll`, `reset`. |
| `StepViewer.tsx` | Generic step controller (works with any `Step[]`): Previous / Next / Run All / Reset buttons, "Step X of N", the current step box, and an auto-scrolling log. |
| `graph/types.ts` | Generic `GraphNode`, `GraphEdge`, `GraphData`. |
| `graph/GraphView.tsx` | Generic Cytoscape.js component. Registers `cytoscape.use(dagre)` once at module level. `rebuildAndLayout` runs the layout once per `layoutKey`; `updateInPlace` only changes classes and labels while stepping. Uses a `ResizeObserver` that calls `cy.resize()`. |
| `styles.css` | Plain CSS, light theme, responsive at 700px. |

### `src/ui/nfaToDfa/` – NFA to DFA UI

| File | What it does |
|---|---|
| `formUtils.ts` | `parseList`, `tableColumns`, `buildNfa`, `nfaToForm`, `emptyForm`, type `NfaFormValues`. |
| `NfaForm.tsx` | The input form (four text fields, the transition table, and the Load example / Clear / Convert buttons). |
| `TransitionTable.tsx` | The auto-built grid of cell inputs (one row per state, one column per symbol plus `ε`). |
| `partialDfa.ts` | `buildPartialDfa(steps, currentStep, fullDfa)` and `formatNfaSteps(nfa, steps, fullDfa)`. |
| `graphData.ts` | `nfaToGraph`, `dfaToGraph`, `activeNfaStates`. |
| `DfaResultView.tsx` | NFA/DFA graph panels plus the progressive DFA table. |
| `stringTrace.ts` | `findMultiCharSymbols`, `findUnknownSymbols`, `traceNfa`, `traceDfa`. |
| `StringTester.tsx` | String tester card. |
| `validationCases.ts` | `VALIDATION_CASES` (8 hand-written cases) and `runValidationCases`. |
| `ValidationPanel.tsx` | "Run validation tests" button and the results table. |
| `*.test.ts` | Vitest tests for each pure helper file. |

---

## 2. Data Flow: From the Form to the Final DFA

1. **Typing.** `NfaForm` keeps raw text in `form` (`NfaFormValues`). On every render it computes `parseList(form.states)` and `tableColumns(parseList(form.alphabet))`, so `TransitionTable` grows and shrinks automatically. Cell text is stored in `form.cells[state][symbol]`.
2. **Convert pressed.** The form's `onSubmit` calls `buildNfa(form)`, which trims and splits every field and skips empty cells (empty cell = no move). It then calls `onSubmit(nfa)`.
3. **Validation.** `AlgorithmPage.handleSubmit(input)` calls `algorithm.validate(input)`, which is `validateNfa`. If the list is not empty, the errors are shown in `ErrorBox`, `output` is set to `null`, and the stepper is reset.
4. **Run.** If the input is valid, `algorithm.run(input)` (which is `subsetConstruction`) returns `{ steps, result }`.
5. **Friendly descriptions.** `ui.formatSteps` (which is `formatNfaSteps`) rewrites each step's `description` in plain English. The DFA itself is not changed.
6. **Store.** `setOutput({ input, result, steps, runKey: prev + 1 })` and `stepper.reset()`. The incremented `runKey` forces a fresh graph layout and remounts `StringTester` (via `key={output.runKey}`).
7. **Stepping.** `StepViewer` changes `stepper.currentStep`. `DfaResultView` receives `steps` and `currentStep` and calls `buildPartialDfa(steps, currentStep, dfa)` to decide which rows and cells to show.
8. **Graphs.** `DfaResultView` builds `nfaToGraph(nfa, activeNfaStates(dfa, partial))` and `dfaToGraph(dfa, partial)` and passes them to two `GraphView`s with `layoutKey` values `nfa-${runKey}` and `dfa-${runKey}`.
9. **String testing.** `StringTester` always uses the FULL `result` DFA (not the partial one) with `traceNfa` and `traceDfa`.

---

## 3. Line-by-Line: `epsilonClosure` (`src/algorithms/nfaToDfa/nfa.ts`)

```ts
export function epsilonClosure(nfa: NFA, states: string[]): string[] {
  const closure = new Set<string>(states);
  const stack = [...states];

  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsilonTargets = nfa.transitions[state]?.[EPSILON] ?? [];
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target);
      }
    }
  }
  return sortStates(nfa, closure);
}
```

- `closure = new Set(states)`: the input states are always in their own closure (zero ε-moves).
- `stack = [...states]`: states whose ε-moves we still have to follow.
- `while (stack.length > 0)`: keep going until there is nothing left to explore.
- `stack.pop()`: take one state to explore.
- `nfa.transitions[state]?.[EPSILON] ?? []`: its ε-targets. A missing entry means none.
- `if (!closure.has(target))`: only new states are added and pushed. This is what guarantees the loop ends, because each state is pushed at most once.
- `sortStates(nfa, closure)`: returns the states in the order of `nfa.states`, so each set has exactly one canonical form (so `{q1,q0}` and `{q0,q1}` are the same state).

---

## 4. Line-by-Line: `subsetConstruction` (`src/algorithms/nfaToDfa/subsetConstruction.ts`)

**Setup**
- `steps: Step[] = []`: the recorded steps.
- `dfaStates: DFAState[] = []`: DFA states in discovery order.
- `transitions`: the DFA table, `transitions[stateName][symbol] = targetName`.
- `seen = new Set<string>()`: names of DFA states already discovered.
- `queue: string[][] = []`: the BFS queue of NFA-state sets still to process.

**Start state**
- `startSet = epsilonClosure(nfa, [nfa.start])`: the DFA starts in every NFA state reachable from the start using ε-moves alone.
- `startName = setName(startSet)`: for example `"{q0}"`. `setName` returns `"∅"` for an empty set.
- `seen.add`, `dfaStates.push`, `queue.push`: register the start state and queue it.
- `steps.push({... data: { from: null, symbol: null, moveResult: [nfa.start], to: startName, isNew: true } })`: the first step.

**BFS loop**
- `while (queue.length > 0)`: process until no undiscovered states remain.
- `currentSet = queue.shift()!`: take from the FRONT (first in, first out, which is what makes it BFS).
- `transitions[currentName] = {}`: start this state's row.
- `for (const symbol of nfa.alphabet)`: one transition per symbol. ε is never in the alphabet, because `validateNfa` rejects that.
  - `moveResult = move(nfa, currentSet, symbol)`: union of the targets of every NFA state in the set.
  - `targetSet = epsilonClosure(nfa, moveResult)`: add the ε-reachable states.
  - `targetName = setName(targetSet)`.
  - `isNew = !seen.has(targetName)`: if it is new, add it to `seen`, `dfaStates`, and `queue`.
  - `transitions[currentName][symbol] = targetName`: exactly one target, so the DFA is complete.
  - `steps.push({... data: { from: currentName, symbol, moveResult, to: targetName, isNew } })`.

**Accepting states and result**
- `accepting = dfaStates.filter(state => state.nfaStates.some(s => nfa.accepting.includes(s)))`: a DFA state accepts if it contains any NFA accepting state.
- The function returns `{ steps, result: dfa }`, where `dfa.alphabet` is a copy of `nfa.alphabet` and `dfa.start = startName`.

**Why it terminates:** there are at most 2ⁿ subsets of n NFA states, and each subset is queued at most once (thanks to `seen`).

---

## 5. Likely Viva Questions

1. **Why can the DFA have up to 2ⁿ states?** Each DFA state is a subset of the n NFA states, and a set of n elements has 2ⁿ subsets (including ∅). In practice, the code builds only the reachable ones.
2. **Why is the empty set the dead state?** If the NFA can be in no state at all, no continuation can ever lead to acceptance. `move(∅, a) = ∅` for every symbol, so ∅ loops to itself and never accepts.
3. **How does ε-closure change the start state?** The start state becomes `epsilonClosure(nfa, [nfa.start])`, not just `{start}`. In case 7 (`a*b*`), that gives `{r0,r1}`, which makes ε accepted because `r1` is accepting.
4. **Why apply ε-closure after every move?** After reading a symbol, the NFA may follow ε-moves for free, so the reachable set is `ε-closure(move(S, a))`.
5. **What happens with missing transitions?** `move` uses `?? []`, so a missing entry contributes nothing. If all members have no move, the result is ∅, the dead state.
6. **Why does the code use a queue (BFS)?** The queue holds discovered-but-unprocessed states, and `queue.shift()` processes them in discovery order. Any order that processes every discovered state would give the same DFA. BFS also gives a predictable step order for the step viewer.
7. **How does the code avoid duplicate DFA states?** `sortStates` gives every set a canonical order, so `setName` always produces the same name, and `seen` is checked before queueing.
8. **When is a DFA state accepting?** When its `nfaStates` contains at least one state from `nfa.accepting`.
9. **Why are unreachable NFA states ignored?** The construction starts from the start state and only follows transitions. Case 5 shows that `q2` never appears.
10. **Is the resulting DFA minimal?** Not necessarily. Subset construction gives an equivalent DFA, not the smallest one. DFA minimization is planned future work.
11. **What does `validateNfa` check?** Non-empty states and alphabet, no `ε` in the alphabet, start and accepting states exist, and transitions use known states and known symbols (or ε).
12. **Why does the app compute the graph layout only once?** `GraphView` runs Dagre in `rebuildAndLayout` only when `layoutKey` changes, on the full DFA. While stepping, `updateInPlace` only toggles classes such as `hidden`, so nodes never jump. Hidden elements still have their positions.
13. **Why does `runKey` exist?** It increments on every Convert, so the graphs get a fresh layout and the string tester resets, even if the same NFA is converted twice.
14. **How do the tests show correctness?** In three ways:
    - Hand-derived expected DFAs are compared to the output.
    - `nfaToDfa.test.ts` checks that `nfaAccepts` and `dfaAccepts` agree on all strings up to length 6.
    - `runValidationCases` checks all strings up to length 5, plus hand-written sample strings.

    Testing is strong evidence, not a mathematical proof. The proof is the subset-construction theorem: after reading w, the DFA is in exactly the set of states the NFA could be in.
15. **How does `nfaAccepts` simulate nondeterminism?** It tracks the set of all possible current states: it starts with `epsilonClosure({start})`, then repeats `epsilonClosure(move(...))` for each letter.
16. **Why is the algorithm code free of React?** So it can be unit-tested and explained independently, and reused by any UI. Only `src/ui/` imports React.
17. **How do you add a new algorithm?** Four steps:
    1. Create the folder `src/algorithms/<name>/`.
    2. Add one line to `src/algorithms/registry.ts`.
    3. Write the UI components in `src/ui/<name>/`.
    4. Add one line to `src/ui/uiRegistry.ts`.

---

## 7. Mealy and Moore Conversion (`src/algorithms/mealyMoore/` & `src/ui/mealyMoore/`)

- **`types.ts`:** Defines `MealyMachine` (output on `(state, symbol)`), `MooreMachine` (output on `state`), `MealyMooreInput`, `MealyMooreResult`, and step data types (`MealyToMooreStepData`, `MooreToMealyStepData`).
- **`validate.ts`:** `validateMealyMoore` checks direction/machine-kind match, non-empty states and alphabets, valid start state and `defaultStartOutput`, complete transitions, and valid outputs in `outputAlphabet`.
- **`convert.ts`:**
  - `mealyToMoore` uses BFS with an unambiguous internal pair key (`JSON.stringify([state, output])`) so state names containing `/` or `,` never collide, and allocates readable display names like `A/0`.
  - `mooreToMealy` emits one step per `(state, symbol)` (total `|Q| * |Σ|` steps), noting in the first step that the Moore start-state output has no Mealy equivalent.
- **`runMachine.ts`:** `runTransducer` executes either machine on an input sequence, returning `outputs` (without Moore's initial start-state output) and `fullOutputs`.
- **`src/ui/mealyMoore/`:** `MealyMooreForm` (direction selector, automatic transition table), `partialMachine.ts` (progressive reveal), `graphData.ts` (two-line Moore node labels `name\nout: <output>` and merged Mealy `input/output` edges), `MealyMooreResultView`, and `MachineTester`.

---

## 8. Pushdown Automaton Simulator (`src/algorithms/pda/` & `src/ui/pda/`)

- **What a PDA is:** A finite automaton with an unbounded stack, modeled in `types.ts` (`PDA`, `PdaTransition`, `PdaConfig`, `PdaResult`). Transitions match `(from, input | ε, top)` and replace `top` with `push` (top-first; `""` = pop only).
- **Acceptance modes:** `final-state` accepts when `remainingInput === ""` and `state ∈ accepting`; `empty-stack` accepts when `remainingInput === ""` and `stack === ""` (`accepting` is ignored).
- **Why nondeterminism needs BFS & guards (`simulate.ts`):** Nondeterministic choices and `ε`-moves create a branching configuration graph, which can even loop infinitely (e.g. pushing on `ε`). BFS with a `visited` set explores shortest paths first, while `maxConfigurations` (`10000`) and `maxStackHeight` (`100`) prevent hangs and return `undecided: limit reached` when triggered without finding acceptance.
- **UI (`src/ui/pda/`):** `PdaForm` (fields, acceptance mode, dynamic transition table), `graphData.ts` (merged multiline `input, top / push` edge labels), and `PdaResultView` (Accepted/Rejected/Undecided badge, `GraphView`, live input tape, and vertical stack).

---

## 6. Items Not Verified

- **CI run.** The GitHub Actions workflow has not been run on GitHub from this machine (no push was done). Its steps were checked locally (`npm ci`, `npm test`, `npm run build`), but the actual Pages deployment is **not verified**.
- **Node 26 on GitHub runners.** The workflow requests Node `26` to match the local machine (`v26.13.0`). Whether `actions/setup-node@v4` provides Node 26 on the runner is **not verified** from here.
