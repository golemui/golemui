import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslTag } from '../../../services/dx/shortcuts/scopes/gslTag.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const smartContactFormDemo: FormDemoDefinition = {
  title: 'Combinations / Smart Contact Form',
  category: 'Combinations',
  description:
    'Every feature in one form: display shortcuts, input shortcuts, full objects, tags, nested layouts, input callbacks, button callbacks, GSL runtime functions, _gslRoot with children + defaults, _gslActionById, and _gslLayoutById',
  formDef: () => [
    _guiInputs({
      firstName: ['string', 'required'],
      lastName: ['string', 'required'],
    }),
  ],
  formSelectors: () => [
    _gslTag(
      'required',
      _gslInputs({
        suppressAutomaticLabels: true,
      }),
    ),
  ],
};
