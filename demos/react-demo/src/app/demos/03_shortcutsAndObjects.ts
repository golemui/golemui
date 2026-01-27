import { FormDemoDefinition } from '../formRegistry.domain';

export const shortcutsAndObjectsDemo: FormDemoDefinition = {
  title: 'Shortcuts and Objects',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  formDef: [{
    name: 'string',
    age: {
      type: 'number',
      placeholder: 'age < 18',
      validator: {
        minimum: 18,
      },
    },
    height: 'number',
  }],
};
