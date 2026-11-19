// Data types for the CFG -> CNF plugin.

/** The symbol used to display epsilon (the empty string). */
export const EPSILON = 'ε';

/**
 * A Context-Free Grammar (CFG).
 * productions[variable] is the list of alternatives for that variable.
 * Each alternative is a list of symbols (variables or terminals);
 * an empty list [] represents ε.
 */
export interface CFG {
  variables: string[];
  terminals: string[];
  start: string;
  productions: Record<string, string[][]>;
}

/** One production rule A -> rhs, used to report added/removed rules in steps. */
export interface ProductionChange {
  lhs: string;
  rhs: string[];
}

/** The 6 stages of CFG -> CNF conversion, in execution order. */
export type CfgStage = 'START' | 'EPSILON' | 'UNIT' | 'USELESS' | 'TERM' | 'BIN';

/** Structured data attached to every Step produced by cfgToCnf. */
export interface CfgStepData {
  stage: CfgStage;
  before: CFG;
  after: CFG;
  added: ProductionChange[];
  removed: ProductionChange[];
  [key: string]: unknown;
}
