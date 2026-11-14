// Maps each algorithm id to its UI components.
// To add the UI for a new algorithm: write its components and add ONE line below.
import type { AlgorithmUI } from './types';
import NfaForm from './nfaToDfa/NfaForm';
import DfaResultView from './nfaToDfa/DfaResultView';
import StringTester from './nfaToDfa/StringTester';
import ValidationPanel from './nfaToDfa/ValidationPanel';
import { formatNfaSteps } from './nfaToDfa/partialDfa';

export const uiRegistry: Record<string, AlgorithmUI> = {
  'nfa-to-dfa': {
    InputForm: NfaForm,
    ResultView: DfaResultView,
    ExtraResultCard: StringTester,
    ValidationPanel,
    formatSteps: formatNfaSteps,
  },
};
