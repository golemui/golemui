import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButton } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';
import { _gslTag } from '../../services/dx/shortcuts/gsl/gslTag.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';
import { _gslActions } from '../../services/dx/shortcuts/gsl/gslActions.impl';
import { _gslLayoutById } from '../../services/dx/shortcuts/gsl/gslLayoutById.impl';
import { _gslActionById } from '../../services/dx/shortcuts/gsl/gslActionById.impl';

export const fullCombinationDemo: FormDemoDefinition = {
  title: 'Kitchen Sink',
  description: 'All features combined: shortcuts, objects, dynamic inputs, tags, custom buttons, nested layouts, and GSL selectors',
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
        married: 'boolean',
        withChildren: 'boolean',
      }),
    ),
    _guiInputs({
      occupation: ['string', 'special'],
    }),
    _guiButton({
      label: 'Log Data',
      onClick: (data: any) => console.log('Form data:', data),
    }),
  ],
  formSelectors: () => [
    _gslTag('no_label',
      _gslInputs({
        suppressAutomaticLabels: true,
        decorator: (currentDef) => ({
          placeholder: `No label: ${currentDef.path}`,
        }),
      }),
    ),
    _gslTag('special',
      _gslInputs({
        decorator: (currentDef) => ({
          placeholder: (currentDef.placeholder ?? currentDef.path) + ' + special!',
        }),
      }),
    ),
    _gslActions({
      decorator: (current) => ({
        ...current,
        disabled: false,
      }),
    }),
    _gslLayoutById('#root', {
      decorator: { direction: 'vertical' },
    }),
    _gslActionById('#submit', {
      decorator: { onClick: (data: any) => alert(JSON.stringify(data)) },
    }),
  ],
};
