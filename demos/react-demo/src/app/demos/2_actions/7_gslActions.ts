import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButtons } from '../../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';
import { _gslActions } from '../../../services/dx/shortcuts/gsl/gslActions.impl';

export const gslActionsDemo: FormDemoDefinition = {
  title: 'Actions / GSL Decorator',
  category: 'Actions',
  description: 'Using _gslActions with a decorator callback to disable all action buttons globally',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButtons([
      { label: 'Save', onClick: (data: any) => console.log('Saved:', data) },
      { label: 'Cancel', onClick: () => console.log('Cancelled') },
      { label: 'Export', disabled: false, onClick: () => console.log('Exported') },
    ]),
  ],
  formSelectors: () =>
    _gslActions({
      decorator: () => ({
        disabled: true,
      }),
    }),
};
