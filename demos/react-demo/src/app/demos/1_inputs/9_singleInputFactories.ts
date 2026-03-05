import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';
import { _guiBooleanInput } from '../../../services/dx/shortcuts/inputs/guiBooleanInput.impl';

export const singleInputFactoriesDemo: FormDemoDefinition = {
  title: 'Inputs / Single Input Factories',
  category: 'Inputs',
  description: 'Using _guiTextInput, _guiNumberInput, and _guiBooleanInput for single-field definitions with perfect type-specific IntelliSense',
  formDef: () => [
    _guiTextInput('firstName', { placeholder: 'Enter first name' }),
    _guiTextInput('lastName', { placeholder: 'Enter last name', hint: 'Family name' }),
    _guiNumberInput('age', { minimum: 0, step: 1 }),
    _guiBooleanInput('newsletter', { togglePosition: 'left' }),
  ],
};
