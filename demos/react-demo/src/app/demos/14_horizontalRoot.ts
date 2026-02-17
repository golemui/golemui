import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslLayoutById } from '../../services/dx/shortcuts/gsl/gslLayoutById.impl';

export const horizontalRootDemo: FormDemoDefinition = {
  title: 'Horizontal Root Layout',
  description: 'Override the auto-generated root layout orientation to horizontal via _gslLayoutById',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslLayoutById('#root', {
      decorator: { direction: 'horizontal' },
    }),
};
