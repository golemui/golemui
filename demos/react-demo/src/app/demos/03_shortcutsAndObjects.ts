import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';

export const shortcutsAndObjectsDemo: FormDemoDefinition = {
  title: 'Shortcuts and Objects',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  formDef: () =>
    _guiFields({
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
