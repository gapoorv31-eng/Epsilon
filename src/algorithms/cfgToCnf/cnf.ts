// 6-stage CFG -> Chomsky Normal Form (CNF) conversion.
// Pure TypeScript: no React or DOM imports.
import type { RunResult, Step } from '../types';
import { EPSILON, type CFG, type CfgStage, type CfgStepData, type ProductionChange } from './types';

/** Deep-clones a CFG so each step snapshot is independent. */
export function cloneCfg(cfg: CFG): CFG {
  const productions: Record<string, string[][]> = {};
  for (const [lhs, alts] of Object.entries(cfg.productions)) {
    productions[lhs] = alts.map((rhs) => [...rhs]);
  }
  return {
    variables: [...cfg.variables],
    terminals: [...cfg.terminals],
    start: cfg.start,
    productions,
  };
}

function rhsKey(rhs: string[]): string {
  return rhs.join('\0');
}

function dedupeAlts(alts: string[][]): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];
  for (const rhs of alts) {
    const key = rhsKey(rhs);
    if (!seen.has(key)) {
      seen.add(key);
      result.push([...rhs]);
    }
  }
  return result;
}

function prodKey(lhs: string, rhs: string[]): string {
  return `${lhs}\0${rhsKey(rhs)}`;
}

function diffProductions(
  before: CFG,
  after: CFG
): { added: ProductionChange[]; removed: ProductionChange[] } {
  const beforeMap = new Map<string, ProductionChange>();
  for (const lhs of before.variables) {
    for (const rhs of before.productions[lhs] ?? []) {
      beforeMap.set(prodKey(lhs, rhs), { lhs, rhs: [...rhs] });
    }
  }

  const afterMap = new Map<string, ProductionChange>();
  for (const lhs of after.variables) {
    for (const rhs of after.productions[lhs] ?? []) {
      afterMap.set(prodKey(lhs, rhs), { lhs, rhs: [...rhs] });
    }
  }

  const added: ProductionChange[] = [];
  for (const [key, change] of afterMap) {
    if (!beforeMap.has(key)) added.push(change);
  }

  const removed: ProductionChange[] = [];
  for (const [key, change] of beforeMap) {
    if (!afterMap.has(key)) removed.push(change);
  }

  return { added, removed };
}

function freshVariable(used: Set<string>, preferred: string): string {
  if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
  }
  let i = 1;
  while (used.has(`${preferred}_${i}`)) {
    i++;
  }
  const name = `${preferred}_${i}`;
  used.add(name);
  return name;
}

function formatRhs(rhs: string[]): string {
  return rhs.length === 0 ? EPSILON : rhs.join(' ');
}

function formatChange(change: ProductionChange): string {
  return `${change.lhs} -> ${formatRhs(change.rhs)}`;
}

function makeStep(
  stage: CfgStage,
  title: string,
  description: string,
  before: CFG,
  after: CFG
): Step {
  const { added, removed } = diffProductions(before, after);
  const data: CfgStepData = { stage, before, after, added, removed };
  return { title, description, data };
}

/** Stage 1: Add a new start symbol S0 -> S. */
function stageStart(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const used = new Set([...before.variables, ...before.terminals]);
  const newStart = freshVariable(used, 'S0');

  const next: CFG = {
    variables: [newStart, ...before.variables],
    terminals: [...before.terminals],
    start: newStart,
    productions: {
      [newStart]: [[before.start]],
      ...cloneCfg(before).productions,
    },
  };

  const step = makeStep(
    'START',
    '1. START — Add new start symbol',
    `Introduced new start variable ${newStart} with production ${newStart} -> ${before.start} so the start symbol never appears on a right-hand side.`,
    before,
    next
  );
  return { next, step };
}

/** Stage 2: Remove ε-productions (find nullable variables, add all combinations). */
function stageEpsilon(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const nullable = new Set<string>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const v of before.variables) {
      if (nullable.has(v)) continue;
      for (const rhs of before.productions[v] ?? []) {
        if (rhs.length === 0 || rhs.every((sym) => nullable.has(sym))) {
          nullable.add(v);
          changed = true;
          break;
        }
      }
    }
  }

  const next = cloneCfg(before);
  for (const v of before.variables) {
    const updated: string[][] = [];
    for (const rhs of before.productions[v] ?? []) {
      if (rhs.length === 0) continue;

      const nullableIndices: number[] = [];
      rhs.forEach((sym, idx) => {
        if (nullable.has(sym)) nullableIndices.push(idx);
      });

      const comboCount = 1 << nullableIndices.length;
      for (let mask = 0; mask < comboCount; mask++) {
        const omit = new Set<number>();
        nullableIndices.forEach((pos, bit) => {
          if ((mask & (1 << bit)) !== 0) omit.add(pos);
        });
        const candidate = rhs.filter((_, idx) => !omit.has(idx));
        if (candidate.length === 0 && v !== before.start) continue;
        updated.push(candidate);
      }
    }
    next.productions[v] = dedupeAlts(updated);
  }

  const keepsEpsilon = (next.productions[next.start] ?? []).some((rhs) => rhs.length === 0);
  const nullableList = before.variables.filter((v) => nullable.has(v));
  const nullableDesc =
    nullableList.length > 0
      ? `Nullable variables: {${nullableList.join(', ')}}.`
      : 'No nullable variables found.';
  const epsDesc = keepsEpsilon
    ? `Kept ${next.start} -> ${EPSILON} because ${EPSILON} is in the language.`
    : `No ${EPSILON}-productions remain because ${EPSILON} is not in the language.`;

  const step = makeStep(
    'EPSILON',
    `2. Remove ${EPSILON}-productions`,
    `${nullableDesc} ${epsDesc}`,
    before,
    next
  );
  return { next, step };
}

/** Stage 3: Remove unit productions (A -> B where B is a variable). */
function stageUnit(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const varSet = new Set(before.variables);
  const next = cloneCfg(before);

  const isUnit = (rhs: string[]) => rhs.length === 1 && varSet.has(rhs[0]);

  for (const v of before.variables) {
    const reach = new Set<string>([v]);
    const queue = [v];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const rhs of before.productions[curr] ?? []) {
        if (isUnit(rhs) && !reach.has(rhs[0])) {
          reach.add(rhs[0]);
          queue.push(rhs[0]);
        }
      }
    }

    const collected: string[][] = [];
    for (const target of reach) {
      for (const rhs of before.productions[target] ?? []) {
        if (!isUnit(rhs)) {
          collected.push([...rhs]);
        }
      }
    }
    next.productions[v] = dedupeAlts(collected);
  }

  const { added, removed } = diffProductions(before, next);
  const desc =
    removed.length === 0
      ? 'No unit productions found.'
      : `Removed ${removed.length} unit ${removed.length === 1 ? 'production' : 'productions'} (${removed.map(formatChange).join(', ')}) and added ${added.length} non-unit ${added.length === 1 ? 'production' : 'productions'}.`;

  const step = makeStep('UNIT', '3. Remove unit productions', desc, before, next);
  return { next, step };
}

/** Stage 4: Remove useless symbols (first non-generating, then unreachable). */
function stageUseless(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const termSet = new Set(before.terminals);

  // 4a. Find generating variables.
  const generating = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const v of before.variables) {
      if (generating.has(v)) continue;
      for (const rhs of before.productions[v] ?? []) {
        if (rhs.every((sym) => termSet.has(sym) || generating.has(sym))) {
          generating.add(v);
          changed = true;
          break;
        }
      }
    }
  }

  const nonGenerating = before.variables.filter((v) => !generating.has(v));
  const afterGenVars = before.variables.filter((v) => generating.has(v) || v === before.start);
  const afterGenProds: Record<string, string[][]> = {};
  for (const v of afterGenVars) {
    afterGenProds[v] = (before.productions[v] ?? [])
      .filter((rhs) => rhs.every((sym) => termSet.has(sym) || generating.has(sym)))
      .map((rhs) => [...rhs]);
  }

  // 4b. Find reachable symbols from start.
  const afterGenVarSet = new Set(afterGenVars);
  const reachableVars = new Set<string>([before.start]);
  const reachableTerms = new Set<string>();
  const queue = [before.start];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const rhs of afterGenProds[curr] ?? []) {
      for (const sym of rhs) {
        if (afterGenVarSet.has(sym)) {
          if (!reachableVars.has(sym)) {
            reachableVars.add(sym);
            queue.push(sym);
          }
        } else if (termSet.has(sym)) {
          reachableTerms.add(sym);
        }
      }
    }
  }

  const unreachableVars = afterGenVars.filter((v) => !reachableVars.has(v));
  const finalVars = afterGenVars.filter((v) => reachableVars.has(v));
  const finalTerms = before.terminals.filter((t) => reachableTerms.has(t));
  const finalProds: Record<string, string[][]> = {};
  for (const v of finalVars) {
    finalProds[v] = afterGenProds[v];
  }

  const next: CFG = {
    variables: finalVars,
    terminals: finalTerms,
    start: before.start,
    productions: finalProds,
  };

  const parts: string[] = [];
  if (nonGenerating.length > 0) {
    parts.push(`Removed non-generating variables: {${nonGenerating.join(', ')}}.`);
  }
  if (unreachableVars.length > 0) {
    parts.push(`Removed unreachable variables: {${unreachableVars.join(', ')}}.`);
  }
  const desc = parts.length > 0 ? parts.join(' ') : 'No non-generating or unreachable symbols found.';

  const step = makeStep('USELESS', '4. Remove useless symbols', desc, before, next);
  return { next, step };
}

/** Stage 5 (TERM): In rules longer than 1 symbol, replace terminals with X_a -> a. */
function stageTerm(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const termSet = new Set(before.terminals);
  const used = new Set([...before.variables, ...before.terminals]);
  const termVarMap = new Map<string, string>();

  const next = cloneCfg(before);
  for (const v of before.variables) {
    const updated: string[][] = [];
    for (const rhs of before.productions[v] ?? []) {
      if (rhs.length <= 1) {
        updated.push([...rhs]);
        continue;
      }
      updated.push(
        rhs.map((sym) => {
          if (!termSet.has(sym)) return sym;
          let tv = termVarMap.get(sym);
          if (!tv) {
            tv = freshVariable(used, `X_${sym}`);
            termVarMap.set(sym, tv);
          }
          return tv;
        })
      );
    }
    next.productions[v] = dedupeAlts(updated);
  }

  for (const [term, tv] of termVarMap) {
    next.variables.push(tv);
    next.productions[tv] = [[term]];
  }

  const introduced = [...termVarMap.entries()].map(([t, v]) => `${v} -> ${t}`);
  const desc =
    introduced.length === 0
      ? 'No terminals appeared inside rules longer than one symbol.'
      : `Replaced terminals in multi-symbol rules using new variables: ${introduced.join(', ')}.`;

  const step = makeStep('TERM', '5. TERM — Isolate terminals', desc, before, next);
  return { next, step };
}

/** Stage 6 (BIN): Break right-hand sides longer than 2 into binary rules. */
function stageBin(cfg: CFG): { next: CFG; step: Step } {
  const before = cloneCfg(cfg);
  const used = new Set([...before.variables, ...before.terminals]);
  let binIndex = 1;
  const nextBinVar = (): string => {
    while (used.has(`Y${binIndex}`)) {
      binIndex++;
    }
    const name = `Y${binIndex}`;
    used.add(name);
    binIndex++;
    return name;
  };

  const next = cloneCfg(before);
  const newVars: string[] = [];

  for (const v of before.variables) {
    const updated: string[][] = [];
    for (const rhs of before.productions[v] ?? []) {
      if (rhs.length <= 2) {
        updated.push([...rhs]);
        continue;
      }
      let currLhs = v;
      let i = 0;
      while (rhs.length - i > 2) {
        const helper = nextBinVar();
        newVars.push(helper);
        const pair = [rhs[i], helper];
        if (currLhs === v) {
          updated.push(pair);
        } else {
          next.productions[currLhs] = [pair];
        }
        currLhs = helper;
        i++;
      }
      next.productions[currLhs] = [[rhs[i], rhs[i + 1]]];
    }
    next.productions[v] = dedupeAlts(updated);
  }

  next.variables.push(...newVars);

  const desc =
    newVars.length === 0
      ? 'All right-hand sides already have length at most 2.'
      : `Split long right-hand sides into binary rules using new variables: ${newVars.join(', ')}.`;

  const step = makeStep('BIN', '6. BIN — Binarize long rules', desc, before, next);
  return { next, step };
}

/**
 * Converts a valid CFG into Chomsky Normal Form (CNF) in 6 stages:
 * START -> EPSILON -> UNIT -> USELESS -> TERM -> BIN.
 */
export function convertCfgToCnf(grammar: CFG): RunResult<CFG> {
  const steps: Step[] = [];

  const s1 = stageStart(grammar);
  steps.push(s1.step);

  const s2 = stageEpsilon(s1.next);
  steps.push(s2.step);

  const s3 = stageUnit(s2.next);
  steps.push(s3.step);

  const s4 = stageUseless(s3.next);
  steps.push(s4.step);

  const s5 = stageTerm(s4.next);
  steps.push(s5.step);

  const s6 = stageBin(s5.next);
  steps.push(s6.step);

  return { steps, result: s6.next };
}
