import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslTag } from '../../../services/dx/shortcuts/scopes/gslTag.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const tagsMultipleDemo: FormDemoDefinition = {
  title: 'Tags / Multiple',
  category: 'Tags',
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
