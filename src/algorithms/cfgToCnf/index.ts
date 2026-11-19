// The CFG -> CNF plugin object. Glues validation and 6-stage CNF conversion
// into the shared Algorithm interface so the registry and UI can use it.
import type { Algorithm } from '../types';
import { convertCfgToCnf } from './cnf';
import { classicExampleCfg } from './example';
import type { CFG } from './types';
import { validateCfg } from './validate';

export const cfgToCnf: Algorithm<CFG, CFG> = {
  id: 'cfg-to-cnf',
  name: 'CFG to Chomsky Normal Form',
  description: 'Converts a context-free grammar into Chomsky Normal Form (CNF) in six stages.',
  exampleInput: classicExampleCfg,
  validate: validateCfg,
  run: convertCfgToCnf,
};

export { convertCfgToCnf } from './cnf';
export { cfgAccepts, cykAccepts, isCnf } from './membership';
export { validateCfg } from './validate';
export * from './types';
