# Epsilon

**An interactive web toolkit that simulates Automata Theory (CSET302) algorithms with step-by-step table and graph visualization.**

- **Live Demo:** `https://<your-github-username>.github.io/Epsilon/` *(replace `<your-github-username>` with your GitHub username)*
- **Validation Test Report:** [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md)
- **Viva & Code Guide:** [`EXPLANATION.md`](EXPLANATION.md)

---

## Features

- **Dynamic NFA Input Form (`NfaForm`, `TransitionTable`):** Enter states, alphabet symbols, start state, and accepting states. The transition table automatically adds rows and columns (plus an `ε` column) as you type without erasing previously entered cells. Includes one-click **Load example** and **Clear** buttons.
- **Thorough Input Validation (`validateNfa`):** Checks for empty state sets or alphabets, reserved `ε` in the input alphabet, unknown start or accepting states, and transitions referencing unknown states or symbols, displaying clear messages in `ErrorBox`.
- **Step-by-Step Execution (`StepViewer`, `useStepper`, `buildPartialDfa`):** Walk through subset construction one transition at a time (`Previous`, `Next`, `Run All`, `Reset`) with an auto-scrolling step log and a progressive DFA transition table that reveals states and cells as they are discovered.
- **Interactive State Diagrams (`GraphView`, `nfaToGraph`, `dfaToGraph`):** Side-by-side NFA and DFA directed graphs powered by Cytoscape.js and Dagre. Supports start arrows, double-bordered accepting states, dashed `ε`-transitions, dashed dead-state (`∅`) nodes, merged multi-symbol edge labels (`a,b`), non-overlapping opposite-direction edges, and a stable DFA layout that never jumps while stepping.
- **Teaching Highlight (`activeNfaStates`):** While stepping through a DFA state (such as `{q0,q1}`), the constituent NFA states (`q0` and `q1`) are highlighted inside the NFA graph.
- **String Tester (`StringTester`, `traceNfa`, `traceDfa`):** Test any input string (including the empty string `ε`) against both the NFA and the full DFA. Displays the step-by-step NFA active-state set table (after `ε`-closure), the deterministic DFA path, and an **NFA and DFA agree** badge.
- **Built-In Validation Suite (`ValidationPanel`, `runValidationCases`):** Runs 8 hand-written test cases directly in the browser and verifies NFA/DFA equivalence across all strings up to length 5.

---

## Screenshots

*(Add your screenshots to [`docs/screenshots/`](docs/screenshots/README.md) with the filenames below.)*

| View | Screenshot |
|---|---|
| **1. NFA Input Form & Example** | ![Overview](docs/screenshots/overview.png) |
| **2. Step-by-Step Progressive Table** | ![Step-by-Step Execution](docs/screenshots/step-by-step.png) |
| **3. Side-by-Side NFA & DFA Graphs** | ![State Diagrams](docs/screenshots/graphs.png) |
| **4. Interactive String Tester** | ![String Tester](docs/screenshots/string-tester.png) |
| **5. Built-In 8-Case Validation Suite** | ![Validation Suite](docs/screenshots/validation-suite.png) |

---

## How to Run Locally

**Prerequisites:** Node.js (v20+ or v26 as configured in CI) and `npm`.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server at http://localhost:5173/
npm run dev

# 3. Run the Vitest unit test suite (36 tests across 6 test files)
npm test

# 4. Type-check and build the production bundle into ./dist
npm run build

# 5. Preview the production build locally (served at /Epsilon/)
npm run preview
```

---

## Algorithm Explained: NFA to DFA (Subset Construction)

A **Nondeterministic Finite Automaton (NFA)** can transition to multiple states on the same symbol, have missing transitions ("no move"), or move without consuming any input via $\varepsilon$-transitions. A **Deterministic Finite Automaton (DFA)** must have **exactly one** transition for every `(state, symbol)` pair and no $\varepsilon$-transitions.

**Subset construction** (`subsetConstruction` in [`src/algorithms/nfaToDfa/subsetConstruction.ts`](src/algorithms/nfaToDfa/subsetConstruction.ts)) converts an NFA into an equivalent DFA by treating each **DFA state as a subset of NFA states** representing all states the NFA could currently occupy:

1. **$\varepsilon$-Closure (`epsilonClosure`):** Given a set of NFA states, follow all outgoing `ε`-transitions repeatedly (using a stack) until no new NFA states can be reached. If the NFA has no `ε`-moves, `epsilonClosure` returns the set unchanged.
2. **Start State:** The DFA start state is `ε-closure({nfa.start})`. Put this initial subset into a **BFS queue** (`queue`) and mark its canonical name (e.g. `{q0}`) in `seen`.
3. **Breadth-First Exploration:** While `queue` is not empty, pop the front subset $S$. For each symbol $a$ in `nfa.alphabet`:
   - Compute `move(nfa, S, a)`: the union of all NFA states reachable from any state in $S$ on symbol $a$.
   - Compute $T = \text{epsilonClosure}(\text{nfa}, \text{move}(\text{nfa}, S, a))$.
   - Record the deterministic transition $\delta(S, a) = T$.
   - If $T$ has not been seen before, add $T$ to `seen` and push it onto the back of `queue`.
4. **Dead State (`∅`):** If `move` returns no states, $T$ is the empty set, named `∅` (`DEAD_STATE`). Because `∅` is queued like any other state, it automatically loops to `∅` on every alphabet symbol. It is only created if actually reached.
5. **Accepting States:** A DFA state is accepting if its subset `nfaStates` contains at least one state from `nfa.accepting`.

### Worked Example: Strings over `{a, b}` Ending in `"ab"`

Defined in [`src/algorithms/nfaToDfa/example.ts`](src/algorithms/nfaToDfa/example.ts):
- **NFA States:** `q0, q1, q2` (start: `q0`, accepting: `q2`)
- **NFA Transitions:** $\delta(q_0, a) = \{q_0, q_1\}$, $\delta(q_0, b) = \{q_0\}$, $\delta(q_1, b) = \{q_2\}$ (all other moves empty).

**Resulting DFA Transition Table (3 states, 1 accepting):**

| DFA State | NFA States Inside | On `'a'` | On `'b'` | Accepting? (`q2` in set?) |
|---|---|---|---|---|
| `→ {q0}` | `q0` | `{q0,q1}` *(new)* | `{q0}` | No |
| `{q0,q1}` | `q0, q1` | `{q0,q1}` | `{q0,q2}` *(new)* | No |
| **`{q0,q2}`** | `q0, q2` | `{q0,q1}` | `{q0}` | **Yes** |

---

## Architecture & How to Add a New Algorithm

Epsilon strictly separates **pure algorithm logic** from the **React user interface**:

```
src/
├── algorithms/                 # Pure TypeScript — ZERO React or DOM imports
│   ├── types.ts                # Shared Algorithm<Input, Result>, RunResult, and Step interfaces
│   ├── registry.ts             # Array of all registered algorithms
│   └── nfaToDfa/               # Self-contained NFA -> DFA plugin + Vitest tests
└── ui/                         # React + Cytoscape.js UI layer
    ├── types.ts                # InputFormProps, ResultViewProps, AlgorithmUI
    ├── uiRegistry.ts           # Maps algorithm.id -> UI components
    ├── AppShell.tsx            # Header, automatic sidebar from registry, main view, footer
    ├── AlgorithmPage.tsx       # Runs validate/run, manages stepper, renders cards
    ├── StepViewer.tsx          # Generic step-by-step controller (works with any Step[])
    ├── useStepper.ts           # Generic step index hook
    ├── graph/                  # Generic Cytoscape.js GraphView + GraphData types
    └── nfaToDfa/               # NFA form, progressive DFA view, graph adapters, string tester, validation suite
```

### Adding a New Algorithm in 4 Steps

1. **Create the algorithm folder:** `src/algorithms/<algorithmName>/` implementing `Algorithm<Input, Result>` from [`src/algorithms/types.ts`](src/algorithms/types.ts) (`id`, `name`, `description`, `exampleInput`, `validate(input)`, `run(input)`). Keep it pure TypeScript.
2. **Add one line to [`src/algorithms/registry.ts`](src/algorithms/registry.ts):**
   ```ts
   export const algorithms: AnyAlgorithm[] = [
     nfaToDfa,
     myNewAlgorithm, // <-- 1 line
   ];
   ```
   *(At this point, the algorithm already appears in the sidebar; if no UI is registered yet, `AlgorithmPage` automatically displays `"UI coming soon for this algorithm."`)*
3. **Create the UI components:** `src/ui/<algorithmName>/` with an `InputForm` component (`InputFormProps<Input>`) and a `ResultView` component (`ResultViewProps<Result, Input>`). Reuse `<StepViewer>` and `<GraphView>` directly.
4. **Add one line to [`src/ui/uiRegistry.ts`](src/ui/uiRegistry.ts):**
   ```ts
   export const uiRegistry: Record<string, AlgorithmUI> = {
     'nfa-to-dfa': { InputForm: NfaForm, ResultView: DfaResultView, ExtraResultCard: StringTester, ValidationPanel, formatSteps: formatNfaSteps },
     'my-new-algorithm': { InputForm: MyForm, ResultView: MyResultView }, // <-- 1 line
   };
   ```

---

## Team (Course CSET302)

| Name | Roll Number | Contribution |
|---|---|---|
| `[Team Member 1 Name]` | `[Roll Number 1]` | `[e.g. Core NFA->DFA subset construction, ε-closure, and Vitest unit tests]` |
| `[Team Member 2 Name]` | `[Roll Number 2]` | `[e.g. Input form, step-by-step controller, and progressive DFA table]` |
| `[Team Member 3 Name]` | `[Roll Number 3]` | `[e.g. Cytoscape.js graph visualization, string tester, and validation suite]` |

---

## Known Limitations & Future Work

### Known Limitations
- **Single-character symbols in String Tester:** Because the string tester reads an input word character by character, `findMultiCharSymbols` in [`src/ui/nfaToDfa/stringTrace.ts`](src/ui/nfaToDfa/stringTrace.ts) requires alphabet symbols to be single characters when testing strings.
- **Exponential worst-case DFA size:** An NFA with $n$ states can produce up to $2^n$ DFA states during subset construction, so very large nondeterministic inputs will produce large tables and graphs.

### Future Work (Planned Phase Plugins)
- **DFA Minimization:** Partition refinement (Hopcroft's / table-filling algorithm) to merge equivalent DFA states.
- **Regular Expression to $\varepsilon$-NFA:** Thompson's construction with step-by-step fragment assembly.
- **$\varepsilon$-NFA to NFA:** Dedicated removal of $\varepsilon$-transitions without full subset construction.

---

## Algorithm Explained: Mealy and Moore Conversion

- **Moore $\to$ Mealy (`mooreToMealy` in [`src/algorithms/mealyMoore/convert.ts`](src/algorithms/mealyMoore/convert.ts)):** Keeps the exact same states and transitions, and sets the Mealy output of `(q, a)` to the Moore output of the target state $\delta(q, a)$. The Moore start state's initial output (emitted before any input) has no Mealy equivalent.
- **Mealy $\to$ Moore (`mealyToMoore` in [`src/algorithms/mealyMoore/convert.ts`](src/algorithms/mealyMoore/convert.ts)):** Runs BFS from `(q0, d)` (where `d` is the chosen default start output, defaulting to the first output symbol), creating reachable Moore states `(q, o)` named `q/o` with state output `o` and transition `(q, o) --a--> (delta(q, a), lambda(q, a))`.
- **UI (`src/ui/mealyMoore/`):** Includes `MealyMooreForm` (direction selector, automatic transition table, default start output field), `MealyMooreResultView` (side-by-side graphs and progressive table), and `MachineTester` (compares output strings while ignoring the Moore start-state output).
