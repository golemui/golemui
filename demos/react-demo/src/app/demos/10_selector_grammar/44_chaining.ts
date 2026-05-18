import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const chainingDemo: FormDemoDefinition = {
  title: '44. Chaining tag().state().inputs()',
  category: 'Ch10: Selector Grammar',
  description:
    'Scope operators compose via dot notation. Each link narrows the match further; the chain ' +
    'always ends with a type selector that carries the config. Toggle "Lock" to see only the ' +
    'investorInfo-tagged inputs disable — the chain matches widgets that carry the tag AND are ' +
    'in the locked state.',
  formDef: () => [
    gui.inputs.checkbox('isLocked', { label: 'Lock' }),
    gui.inputs.textInput('investorName', { label: 'Investor name' }, ['investorInfo']),
    gui.inputs.textInput('investorEmail', { label: 'Investor email' }, ['investorInfo']),
    gui.inputs.textInput('memo', { label: 'Memo' }),
    gui.actions.button({ label: 'Submit' }),
  ],
  formSelectors: () => [
    gui.selectors
      .tag('investorInfo')
      .state('locked')
      .inputs({
        override: { disabled: true },
      }),
  ],
  formConfig: () => ({
    states: { locked: '!!$form.isLocked' },
  }),
};
