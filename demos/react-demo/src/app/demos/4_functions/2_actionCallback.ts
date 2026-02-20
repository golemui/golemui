import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiButton } from '../../../services/dx/shortcuts/actions/guiActions.impl';

export const actionCallbackDemo: FormDemoDefinition = {
  title: 'Functions / Action Callback',
  category: 'Functions',
  description: 'A _guiButton defined with ActionDefCallback — the button label and disabled state change based on runtime params.data',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButton((params) => ({
      label: params.$form?.name ? `Submit for ${params.$form.name}` : 'Submit',
      disabled: !params.$form?.name,
      onClick: (data: any) => alert(JSON.stringify(data)),
    })),
  ],
};
