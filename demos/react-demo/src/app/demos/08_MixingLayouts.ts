import { FormDemoDefinition } from '../formRegistry.domain';

export const mixingLayouts: FormDemoDefinition = {
  title: 'Mixing Layouts',
  description: 'Basic layout mixing',
  formDef: [
    {
      name: 'string',
      age: 'number',
      height: 'number',
    },
    {
      _horizontalLayout: [
        {
          children: 'number', cars: 'number',
        },
      ],
    },
    {
      occupation: 'string',
    },
  ],
  warnings: ['stack in horizontal mode not working yet']
};
