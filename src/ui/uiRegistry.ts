// Maps each algorithm id to its UI components.
// To add the UI for a new algorithm: write its components and add ONE line below.
import type { AlgorithmUI } from './types';
import NfaForm from './nfaToDfa/NfaForm';
import DfaResultView from './nfaToDfa/DfaResultView';
import StringTester from './nfaToDfa/StringTester';
import ValidationPanel from './nfaToDfa/ValidationPanel';
import { formatNfaSteps } from './nfaToDfa/partialDfa';
import CfgForm from './cfgToCnf/CfgForm';
import CfgResultView from './cfgToCnf/CfgResultView';
import MealyMooreForm from './mealyMoore/MealyMooreForm';
import MealyMooreResultView from './mealyMoore/MealyMooreResultView';
import MachineTester from './mealyMoore/MachineTester';
import PdaForm from './pda/PdaForm';
import PdaResultView from './pda/PdaResultView';

export const uiRegistry: Record<string, AlgorithmUI> = {
  'nfa-to-dfa': {
    InputForm: NfaForm,
    ResultView: DfaResultView,
    ExtraResultCard: StringTester,
    ValidationPanel,
    formatSteps: formatNfaSteps,
  },
  'cfg-to-cnf': { InputForm: CfgForm, ResultView: CfgResultView },
  'mealy-moore': { InputForm: MealyMooreForm, ResultView: MealyMooreResultView, ExtraResultCard: MachineTester },
  pda: { InputForm: PdaForm, ResultView: PdaResultView },
};
