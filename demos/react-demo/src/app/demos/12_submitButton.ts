import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiSubmitButton } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';

export const formDemoDefinition: FormDemoDefinition = {
  title: 'Should let us configure the submit button',
  description: 'Should let us configure the submit button',
  formDef: ()=>[
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiSubmitButton(),
    _guiInputs({
      gender: 'string',
    }),
  ],
};
