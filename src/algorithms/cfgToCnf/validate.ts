// Input validation for the CFG -> CNF plugin.
import { EPSILON, type CFG } from './types';

/**
 * Checks that a CFG is well-formed. Returns a list of clear error
 * messages; an empty list means the CFG is valid.
 */
export function validateCfg(grammar: CFG): string[] {
  const errors: string[] = [];

  if (grammar.variables.length === 0) {
    errors.push('There must be at least one variable.');
  }

  if (grammar.variables.includes(EPSILON)) {
    errors.push(`'${EPSILON}' is reserved for the empty string and cannot be a variable.`);
  }
  if (grammar.terminals.includes(EPSILON)) {
    errors.push(`'${EPSILON}' is reserved for the empty string and cannot be a terminal.`);
  }

  const varSet = new Set(grammar.variables);
  const termSet = new Set(grammar.terminals);

  for (const v of grammar.variables) {
    if (termSet.has(v)) {
      errors.push(`Symbol '${v}' cannot be both a variable and a terminal.`);
    }
  }

  if (!varSet.has(grammar.start)) {
    errors.push(`Start symbol '${grammar.start}' is not in the list of variables.`);
  }

  const totalRules = Object.values(grammar.productions).reduce((sum, alts) => sum + alts.length, 0);
  if (totalRules === 0) {
    errors.push('The production set must not be empty.');
  }

  for (const [lhs, alts] of Object.entries(grammar.productions)) {
    if (!varSet.has(lhs)) {
      errors.push(`Production left-hand side '${lhs}' is not in the list of variables.`);
      continue;
    }
    for (const rhs of alts) {
      for (const sym of rhs) {
        if (!varSet.has(sym) && !termSet.has(sym)) {
          errors.push(
            `Symbol '${sym}' in production ${lhs} -> ${rhs.join(' ')} is neither a variable nor a terminal.`
          );
        }
      }
    }
  }

  return errors;
}
