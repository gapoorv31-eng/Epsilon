// Parses and formats CFG rules for the CFG -> CNF input textarea.
import { EPSILON, type CFG } from '../../algorithms/cfgToCnf';

export interface ParseGrammarResult {
  grammar: CFG | null;
  errors: string[];
}

const isVariableToken = (token: string): boolean => /^[A-Z]/.test(token);
const isEpsilonToken = (token: string): boolean => token === EPSILON || token === 'eps';

/**
 * Parses a multi-line CFG text into a CFG object.
 * Rules are one per line: `S -> A S B | ε`
 * Tokens starting with an uppercase letter (A-Z) are treated as variables;
 * all other tokens (except ε / eps) are treated as terminals.
 */
export function parseGrammarText(text: string): ParseGrammarResult {
  const lines = text.split(/\r?\n/);
  const errors: string[] = [];

  const variables: string[] = [];
  const terminals: string[] = [];
  const varSeen = new Set<string>();
  const termSeen = new Set<string>();
  const productions: Record<string, string[][]> = {};
  let start = '';

  const addVar = (sym: string) => {
    if (!varSeen.has(sym)) {
      varSeen.add(sym);
      variables.push(sym);
    }
  };
  const addTerm = (sym: string) => {
    if (!termSeen.has(sym)) {
      termSeen.add(sym);
      terminals.push(sym);
    }
  };

  let ruleCount = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    const lineNum = index + 1;
    ruleCount++;

    const arrowMatch = line.match(/->|→/);
    if (!arrowMatch || arrowMatch.index === undefined) {
      errors.push(`Line ${lineNum}: missing '->' arrow (expected format: S -> A B | a).`);
      return;
    }

    const lhsRaw = line.slice(0, arrowMatch.index).trim();
    const rhsRaw = line.slice(arrowMatch.index + arrowMatch[0].length).trim();

    if (!lhsRaw) {
      errors.push(`Line ${lineNum}: missing left-hand side variable before '->'.`);
      return;
    }

    const lhsTokens = lhsRaw.split(/\s+/);
    if (lhsTokens.length > 1) {
      errors.push(`Line ${lineNum}: left-hand side '${lhsRaw}' must be a single variable.`);
      return;
    }

    const lhs = lhsTokens[0];
    if (isEpsilonToken(lhs)) {
      errors.push(`Line ${lineNum}: '${lhs}' cannot be on the left-hand side of a rule.`);
      return;
    }

    if (!start) start = lhs;
    if (isVariableToken(lhs)) {
      addVar(lhs);
    } else {
      addTerm(lhs);
    }

    if (!rhsRaw) {
      errors.push(`Line ${lineNum}: missing right-hand side after '->' (use 'ε' or 'eps' for empty).`);
      return;
    }

    const altParts = rhsRaw.split('|');
    if (!productions[lhs]) productions[lhs] = [];

    for (const altPart of altParts) {
      const trimmedAlt = altPart.trim();
      if (!trimmedAlt) {
        errors.push(`Line ${lineNum}: empty alternative in '${line}' (use 'ε' or 'eps' for empty).`);
        continue;
      }

      const tokens = trimmedAlt.split(/\s+/);
      if (tokens.some(isEpsilonToken)) {
        if (tokens.length > 1) {
          errors.push(`Line ${lineNum}: '${EPSILON}' cannot be combined with other symbols in '${trimmedAlt}'.`);
          continue;
        }
        productions[lhs].push([]);
        continue;
      }

      for (const tok of tokens) {
        if (isVariableToken(tok)) {
          addVar(tok);
        } else {
          addTerm(tok);
        }
      }
      productions[lhs].push(tokens);
    }
  });

  if (ruleCount === 0) {
    errors.push('Please enter at least one production rule.');
  }

  if (errors.length > 0) {
    return { grammar: null, errors };
  }

  return {
    grammar: { variables, terminals, start, productions },
    errors: [],
  };
}

/** Formats a CFG back into readable `A -> B C | a` lines. */
export function formatGrammarText(cfg: CFG): string {
  return cfg.variables
    .filter((v) => (cfg.productions[v] ?? []).length > 0)
    .map((v) => {
      const alts = cfg.productions[v].map((rhs) => (rhs.length === 0 ? EPSILON : rhs.join(' ')));
      return `${v} -> ${alts.join(' | ')}`;
    })
    .join('\n');
}
