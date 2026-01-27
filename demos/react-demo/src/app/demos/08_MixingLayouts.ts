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
    [
      '_horizontalLayout', [
        {
          married: 'number', withChildren: 'number',
        },
      ],
    ],
    {
      occupation: 'string',
    },
  ],
};
