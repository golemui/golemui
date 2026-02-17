import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslTag } from '../../services/dx/shortcuts/gsl/gslTag.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const simplestTagging: FormDemoDefinition = {
  title: 'Simplest Tagging',
  description: 'Shortcuts with tags',
  formDef: ()=>_guiInputs({
    name: ['string', 'no_label'],
    age: 'number',
    height: ['number', 'no_label'],
  }),
  formSelectors: () =>
    _gslTag('no_label',
      _gslInputs({
        suppressAutomaticLabels: true,
        decorator: (currentDef) => ({ placeholder: currentDef.path + ' I am special!' }),
      }),
    ),
};
