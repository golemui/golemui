import { FormDemoDefinition } from '../formRegistry.domain';

export const simplestDemo: FormDemoDefinition = {
  title: 'Simplest Form',
  description: 'Shortcuts for everything',
  formDef: [{
    name: 'string',
    age: 'number',
    height: 'number',
  }],
};
