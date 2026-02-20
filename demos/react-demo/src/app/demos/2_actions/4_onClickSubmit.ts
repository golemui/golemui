import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiButton } from '../../../services/dx/shortcuts/actions/guiActions.impl';

export const onClickSubmitDemo: FormDemoDefinition = {
  title: 'Actions / onClick: submit',
  category: 'Actions',
  description: 'Using onClick: \'submit\' to promote a regular _guiButton to the form\'s submit button. No _guiSubmitButton needed.',
  formDef: () => [
    _guiInputs({
      name: 'string',
      email: 'string',
    }),
    _guiButton({
      label: 'Go!',
      onClick: 'submit',
    }),
  ],
};
