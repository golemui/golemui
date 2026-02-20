import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/scopes/gslRoot.impl';

export const gslRootOnSubmitDemo: FormDemoDefinition = {
  title: 'Actions / Custom onSubmit (_gslRoot)',
  category: 'Actions',
  description: 'Using _gslRoot({ onSubmit }) to configure the default submit handler. The auto-generated submit button triggers this callback.',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
  formSelectors: () =>
    _gslRoot({ onSubmit: (data: any) => alert('Submitted: ' + JSON.stringify(data)) }),
};
