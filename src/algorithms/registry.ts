// The list of all algorithms in Epsilon.
// To add a new algorithm: create src/algorithms/<name>/ and add ONE line below.
import type { AnyAlgorithm } from './types';
import { nfaToDfa } from './nfaToDfa';

export const algorithms: AnyAlgorithm[] = [
  nfaToDfa,
];
