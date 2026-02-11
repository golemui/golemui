import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const shortcutsAndObjectsDemo: FormDemoDefinition = {
  title: 'Shortcuts and Objects',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: {
        type: 'number',
        placeholder: 'age < 18',
        validator: {
          minimum: 18,
        },
      },
      height: 'number',
    })
};
