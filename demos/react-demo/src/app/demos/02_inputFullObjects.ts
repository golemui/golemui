import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const inputFullObjectsDemo: FormDemoDefinition = {
  title: 'Input Full Objects',
  description: 'Inputs defined with explicit InputDecorator objects specifying type, label, and placeholder',
  formDef: () =>
    _guiInputs({
      name: {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
      },
      age: {
        type: 'number',
        label: 'Age',
        placeholder: 'Enter your age',
      },
      active: {
        type: 'boolean',
        label: 'Is Active',
      },
    }),
};
