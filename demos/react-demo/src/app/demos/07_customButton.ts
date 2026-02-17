import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButton } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';

export const customButtonDemo: FormDemoDefinition = {
  title: 'Custom Button',
  description: 'A custom button using _guiButton with a label and onClick handler',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiButton({
      label: 'Say Hello',
      onClick: (data: any) => alert(`Hello ${data?.name ?? 'stranger'}!`),
    }),
  ],
};
