import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButtons } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';
import { _gslActions } from '../../services/dx/shortcuts/gsl/gslActions.impl';

export const gslActionsDemo: FormDemoDefinition = {
  title: 'GSL Action Decorator',
  description: 'Using _gslActions with a decorator callback to customize all action buttons',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButtons([
      { label: 'Save' },
      { label: 'Cancel' },
    ]),
  ],
  formSelectors: () =>
    _gslActions({
      decorator: (current) => ({
        ...current,
        disabled: false,
      }),
    }),
};
