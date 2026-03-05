import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';
import { _guiBooleanInput } from '../../../services/dx/shortcuts/inputs/guiBooleanInput.impl';

export const inputFullObjectsDemo: FormDemoDefinition = {
  title: 'Inputs / Full Objects',
  category: 'Inputs',
  description: 'Inputs defined with explicit InputDecorator objects specifying type, label, and placeholder',
  formDef: () => [
    _guiTextInput('name', {
      label: 'Full Name',
      placeholder: 'Enter your full name',
    }),
    _guiNumberInput('age', {
      label: 'Age',
      placeholder: 'Enter your age',
    }),
    _guiBooleanInput('active', {
      label: 'Is Active',
    }),
  ],
};
