import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _gslInputs } from '@golemui/gui-shared';

export const globalConfigDemo: FormDemoDefinition = {
  title: '22. Global Config Flags',
  category: 'Ch5: Selectors',
  description:
    'Selectors configure behavior across all matching widgets with a single line. '
    + 'Suppress auto-generated labels, placeholders, the submit button, or the root layout. '
    + 'These are form-level policies — they apply to every widget of that type.',
  formDef: () =>
    _guiInputs({ name: 'string', age: 'number', email: 'string' }),
  formSelectors: () => [
    _gslInputs({ suppressAutomaticLabels: true, suppressAutomaticPlaceholders: true }),
  ],
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
