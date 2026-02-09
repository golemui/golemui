import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/formDef/dx/gui/shortcuts/guiStack.impl';

export const allBasicFunctionality: FormDemoDefinition = {
  title: 'All Basic Functionality',
  description: 'Shortcuts, full definitions, layouts, tags...',
  formDef: () => [
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
      height: ['number', 'special', 'no_label'],
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
        defaultInputDef: (currentDef) => ({
          placeholder: `I have no label ${[currentDef.path]}`,
        }),
      },
      special: {
        defaultInputDef: (currentDef) => ({
          placeholder: currentDef.placeholder + ' + I am special!',
        }),
      },
    },
  },
};
