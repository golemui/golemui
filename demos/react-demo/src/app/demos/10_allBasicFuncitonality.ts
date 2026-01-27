import { FormDemoDefinition } from '../formRegistry.domain';

export const allBasicFunctionality: FormDemoDefinition = {
  title: 'All Basic Functionality',
  description: 'Shortcuts, full definitions, layouts, tags...',
  formDef: [
    {
      name: ['string', 'no_label'],
      age: ({ error }: any) => ({
        label: error ? 'Age must be at least 18' : 'Age',
        type: 'number',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      }),
      height: ['number', 'no_label', 'special'],
    },
    [
      '_horizontalLayout', [
        {
          married: 'number',
          withChildren: 'number',
        },
      ],
    ],
    {
      occupation: 'string',
    },
  ],
  formConfig: {
    tags: {
      no_label: {
        suppressAutomaticLabels: true,
      },
      special: {
        defaultFieldDef: ({ currentDef }) => ({
          placeholder: currentDef.placeholder + ' I am special!',
        }),
      },
    },
  },
};
