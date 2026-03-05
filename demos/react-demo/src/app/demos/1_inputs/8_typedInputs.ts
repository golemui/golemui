import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';
import { _guiBooleanInput } from '../../../services/dx/shortcuts/inputs/guiBooleanInput.impl';

export const typedInputsDemo: FormDemoDefinition = {
  title: 'Inputs / Typed Inputs',
  category: 'Inputs',
  description: 'Using type-specific factories for text, number, and boolean decorators with focused IntelliSense',
  formDef: () => [
    _guiTextInput('name', { placeholder: 'Full name', hint: 'As on your ID' }),
    _guiNumberInput('age', { minimum: 0, maximum: 150 }),
    _guiBooleanInput('active', { togglePosition: 'right' }),
  ],
};
