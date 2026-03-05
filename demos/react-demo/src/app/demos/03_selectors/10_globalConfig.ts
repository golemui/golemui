import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _gslInputs, _gslRoot } from '../../../services/dx';

export const globalConfigDemo: FormDemoDefinition = {
  title: '10. Global Config Flags',
  category: 'Ch3: Selectors',
  description:
    'Selectors configure behavior across all matching widgets with a single line. '
    + 'Suppress auto-generated labels, placeholders, the submit button, or the root layout. '
    + 'These are form-level policies — they apply to every widget of that type.',
  formDef: () =>
    _guiInputs({ name: 'string', age: 'number', email: 'string' }),
  formSelectors: () => [
    _gslInputs({ suppressAutomaticLabels: true, suppressAutomaticPlaceholders: true }),
    _gslRoot({ suppressAutomaticSubmit: true }),
  ],
};
