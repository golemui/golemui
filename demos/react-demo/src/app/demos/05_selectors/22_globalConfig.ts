import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const globalConfigDemo: FormDemoDefinition = {
  title: '22. Global Config Flags',
  category: 'Ch5: Selectors',
  description:
    'Selectors configure behavior across all matching widgets with a single line. ' +
    'Suppress auto-generated labels, placeholders, the submit button, or the root layout. ' +
    'These are form-level policies — they apply to every widget of that type.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.numberInput('age'),
    gui.inputs.textInput('email'),
  ],
  formSelectors: () => [
    gui.selectors.inputs({ suppressAutomaticLabels: true, suppressAutomaticPlaceholders: true }),
  ],
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
