import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const allBasicFunctionality: FormDemoDefinition = {
  title: 'All Basic Functionality',
  description: 'Shortcuts, full definitions, layouts, tags...',
  formDef: () => [
    _guiInputs({
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
      _guiInputs({
        married: 'number',
        withChildren: 'number',
      }),
    ),
    _guiInputs({
      occupation: 'string',
    }),
  ],
  formConfig: {
    tags: {
      no_label: {
        sensibleDefaults: {
          inputs: {
            suppressAutomaticLabels: true,
          },
        },
        decorators: {
          inputs: (currentDef) => ({
            placeholder: `I have no label ${[currentDef.path]}`,
          }),
        },
      },
      special: {
        decorators: {
          inputs: (currentDef) => ({
            placeholder: currentDef.placeholder + ' + I am special!',
          }),
        },
      },
    },
  },
  // formConfig2: [
  //   _gslTag('no_label', {
  //     inputs: {
  //       suppressAutomaticLabels: true,
  //       decorator: (currentDef) => ({
  //         placeholder: `I have no label ${[currentDef.path]}`,
  //       }),
  //     },
  //   }),
  //   _gslTag('special', {
  //     inputs: {
  //       decorator: (currentDef) => ({
  //         placeholder: currentDef.placeholder + ' + I am special!',
  //       }),
  //     },
  //   }),
  // ],
};
