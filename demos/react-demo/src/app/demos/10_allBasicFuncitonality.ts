import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';
import { _guiHorizontalStack } from '../../services/formDef/dx/gui/fields/guiStack.impl';

export const allBasicFunctionality: FormDemoDefinition = {
  title: 'All Basic Functionality',
  description: 'Shortcuts, full definitions, layouts, tags...',
  formDef: ()=>[
    _guiFields({
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
    }),
    _guiHorizontalStack(
        _guiFields({
          married: 'number',
          withChildren: 'number',
        }),
    ),
    _guiFields({
      occupation: 'string',
    }),
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
