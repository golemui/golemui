import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const singleStateOperatorDemo: FormDemoDefinition = {
  title: '47. state(name) — single-value',
  category: 'Ch10: Selector Grammar',
  description:
    "state(name) is the v2.0 spec's only state operator — singular, taking exactly one " +
    "state name (renamed from v1.5's plural states(name) per Raúl, round-2 correction). " +
    'The chain produces state-suffixed overrides that the core state engine toggles at ' +
    'runtime. Toggle "Submitted" to disable inputs and change the submit label.',
  formDef: () => [
    gui.inputs.checkbox('isSubmitted', { label: 'Submitted' }),
    gui.inputs.textInput('subject'),
    gui.inputs.textInput('body'),
    gui.actions.button({ label: 'Send' }),
  ],
  formSelectors: () => [
    gui.selectors.state('submitted').inputs({ override: { disabled: true } }),
    gui.selectors.state('submitted').actions({ override: { label: 'Sent' } }),
  ],
  formConfig: () => ({
    states: { submitted: '!!$form.isSubmitted' },
  }),
};
