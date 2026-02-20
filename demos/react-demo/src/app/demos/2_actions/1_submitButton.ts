import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiSubmitButton } from '../../../services/dx/shortcuts/actions/guiActions.impl';

export const submitButtonDemo: FormDemoDefinition = {
  title: 'Actions / Auto Submit (default onSubmit)',
  category: 'Actions',
  description: 'Explicit _guiSubmitButton() placed between input groups. Uses the default onSubmit (logs data to console).',
  formDef: () => [
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
