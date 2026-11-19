// Membership testing (CYK for CNF, Earley for general CFGs) and CNF shape check.
// Pure TypeScript: no React or DOM imports.
import type { CFG } from './types';

/** Checks that every production in `cfg` satisfies Chomsky Normal Form. */
export function isCnf(cfg: CFG): boolean {
  const varSet = new Set(cfg.variables);
  const termSet = new Set(cfg.terminals);

  if (!varSet.has(cfg.start)) return false;

  for (const [lhs, alts] of Object.entries(cfg.productions)) {
    if (!varSet.has(lhs)) return false;
    for (const rhs of alts) {
      if (rhs.length === 0) {
        if (lhs !== cfg.start) return false;
      } else if (rhs.length === 1) {
        if (!termSet.has(rhs[0])) return false;
      } else if (rhs.length === 2) {
        if (!varSet.has(rhs[0]) || !varSet.has(rhs[1])) return false;
        if (rhs[0] === cfg.start || rhs[1] === cfg.start) return false;
      } else {
        return false;
      }
    }
  }
  return true;
}

/**
 * CYK membership test for a grammar in Chomsky Normal Form.
 * `word` is an array of terminal symbols (empty array [] for ε).
 */
export function cykAccepts(cnf: CFG, word: string[]): boolean {
  const n = word.length;
  if (n === 0) {
    return (cnf.productions[cnf.start] ?? []).some((rhs) => rhs.length === 0);
  }

  // table[len][start] holds variables deriving word[start .. start + len - 1].
  const table: Set<string>[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: n }, () => new Set<string>())
  );

  for (let i = 0; i < n; i++) {
    for (const v of cnf.variables) {
      for (const rhs of cnf.productions[v] ?? []) {
        if (rhs.length === 1 && rhs[0] === word[i]) {
          table[1][i].add(v);
        }
      }
    }
  }

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      for (let split = 1; split < len; split++) {
        const left = table[split][i];
        const right = table[len - split][i + split];
        if (left.size === 0 || right.size === 0) continue;

        for (const v of cnf.variables) {
          if (table[len][i].has(v)) continue;
          for (const rhs of cnf.productions[v] ?? []) {
            if (rhs.length === 2 && left.has(rhs[0]) && right.has(rhs[1])) {
              table[len][i].add(v);
              break;
            }
          }
        }
      }
    }
  }

  return table[n][0].has(cnf.start);
}

interface EarleyItem {
  lhs: string;
  rhs: string[];
  dot: number;
  start: number;
}

/**
 * Exact membership test for an arbitrary CFG (including ε- and unit-productions)
 * using Earley's algorithm with Aycock-Horspool nullable handling.
 */
export function cfgAccepts(cfg: CFG, word: string[]): boolean {
  const varSet = new Set(cfg.variables);
  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const v of cfg.variables) {
      if (nullable.has(v)) continue;
      for (const rhs of cfg.productions[v] ?? []) {
        if (rhs.length === 0 || rhs.every((sym) => nullable.has(sym))) {
          nullable.add(v);
          changed = true;
          break;
        }
      }
    }
  }

  const n = word.length;
  const chart: EarleyItem[][] = Array.from({ length: n + 1 }, () => []);
  const seen: Set<string>[] = Array.from({ length: n + 1 }, () => new Set<string>());

  const addItem = (pos: number, item: EarleyItem) => {
    const key = `${item.lhs}\0${item.rhs.join(' ')}\0${item.dot}\0${item.start}`;
    if (!seen[pos].has(key)) {
      seen[pos].add(key);
      chart[pos].push(item);
    }
  };

  const root = '__EARLEY_START__';
  addItem(0, { lhs: root, rhs: [cfg.start], dot: 0, start: 0 });

  for (let i = 0; i <= n; i++) {
    for (let idx = 0; idx < chart[i].length; idx++) {
      const item = chart[i][idx];
      if (item.dot < item.rhs.length) {
        const sym = item.rhs[item.dot];
        if (varSet.has(sym)) {
          for (const prodRhs of cfg.productions[sym] ?? []) {
            addItem(i, { lhs: sym, rhs: prodRhs, dot: 0, start: i });
          }
          if (nullable.has(sym)) {
            addItem(i, { ...item, dot: item.dot + 1 });
          }
        } else if (i < n && word[i] === sym) {
          addItem(i + 1, { ...item, dot: item.dot + 1 });
        }
      } else {
        for (const prev of chart[item.start]) {
          if (prev.dot < prev.rhs.length && prev.rhs[prev.dot] === item.lhs) {
            addItem(i, { ...prev, dot: prev.dot + 1 });
          }
        }
      }
    }
  }

  return chart[n].some((item) => item.lhs === root && item.dot === 1 && item.start === 0);
}
