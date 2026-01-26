import { FormDemoDefinition } from '../formRegistry.domain';

export const formDemoDefinition: FormDemoDefinition = {
  title: 'Should let us configure the submit button',
  description: 'Should let us configure the submit button',
  formDef: [
    {
      name: 'string',
      age: 'number',
    },
    '_submitButton',
    {
      gender: 'string',
    },
  ],
  formConfig: {
    onSubmit: (data: any) => alert(JSON.stringify(data)),
  },
};
