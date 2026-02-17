import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslRoot } from '../../services/dx/shortcuts/gsl/gslRoot.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const formConfigSimplest: FormDemoDefinition = {
  title: 'Form Selectors',
  description:
    'Form driven by formSelectors making all labels blank, it also uses a shortcut that decorates the field under the hood',
  formSelectors: () =>
    _gslRoot(
      _gslInputs({
        decorator: ({ path }) => ({
          label: '',
          placeholder: `${path}`,
        }),
      }),
    ),
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
