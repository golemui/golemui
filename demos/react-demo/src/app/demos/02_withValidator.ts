import { FormDemoDefinition } from '../formRegistry.domain';

export const withValidatorDemo: FormDemoDefinition = {
  title: 'With Validator',
  description: 'Form data with a single validator',
  formDef: [{
    name: {
      type: 'text',
      validator: {
        minLength: 3,
      },
    },
  }],
};
