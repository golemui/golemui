import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';
import { _gslTag } from '../../services/dx/shortcuts/gsl/gslTag.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const allBasicFunctionality: FormDemoDefinition = {
  title: 'All Basic Functionality',
  description: 'Shortcuts, full definitions, layouts, tags...',
  formDef: () => [
    _guiInputs({
      name: ['string', 'no_label'],
      age: (params) => ({
        label: params.errors != null && params.errors.length > 0 ? 'Age must be at least 18' : 'Age',
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
  formSelectors: () => [
    _gslTag('no_label',
      _gslInputs({
        suppressAutomaticLabels: true,
        decorator: (currentDef) => ({
          placeholder: `I have no label ${[currentDef.path]}`,
        }),
      }),
    ),
    _gslTag('special',
      _gslInputs({
        decorator: (currentDef) => ({
          placeholder: currentDef.placeholder + ' + I am special!',
        }),
      }),
    ),
  ],
};
