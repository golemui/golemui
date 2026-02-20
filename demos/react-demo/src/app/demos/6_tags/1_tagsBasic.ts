import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslTag } from '../../../services/dx/shortcuts/scopes/gslTag.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const tagsBasicDemo: FormDemoDefinition = {
  title: 'Tags / Basic',
  category: 'Tags',
  description: 'Tagged tuples in _guiInputs with a _gslTag scope that targets only tagged inputs',
  formDef: () =>
    _guiInputs({
      name: ['string', 'no_label'],
      age: 'number',
      height: ['number', 'no_label'],
    }),
  formSelectors: () =>
    _gslTag('no_label',
      _gslInputs({
        suppressAutomaticLabels: true,
        decorator: (currentDef) => ({ placeholder: currentDef.path + ' (no label)' }),
      }),
    ),
};
