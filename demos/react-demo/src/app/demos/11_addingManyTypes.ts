import { FormDemoDefinition } from '../formRegistry.domain';

export const manyTypes: FormDemoDefinition = {
  title: 'This form tests many different types of controls',
  description: 'Shortcuts for everything',
  formDef: [{
    name: 'string',
    age: 'number',
    height: 'number',
    married: 'boolean',
  }],
};
