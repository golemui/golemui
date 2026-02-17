import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslTag } from '../../services/dx/shortcuts/gsl/gslTag.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const tagsMultipleDemo: FormDemoDefinition = {
  title: 'Multiple Tags',
  description: 'Multiple _gslTag scopes targeting different tags with different decorators',
  formDef: () =>
    _guiInputs({
      name: ['string', 'no_label'],
      age: 'number',
      height: ['number', 'special', 'no_label'],
      occupation: ['string', 'special'],
    }),
  formSelectors: () => [
    _gslTag('no_label',
      _gslInputs({
        suppressAutomaticLabels: true,
        decorator: (currentDef) => ({
          placeholder: `I have no label: ${currentDef.path}`,
        }),
      }),
    ),
    _gslTag('special',
      _gslInputs({
        decorator: (currentDef) => ({
          placeholder: (currentDef.placeholder ?? currentDef.path) + ' + I am special!',
        }),
      }),
    ),
  ],
};
