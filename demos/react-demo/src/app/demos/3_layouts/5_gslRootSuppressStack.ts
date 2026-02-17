import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/gsl/gslRoot.impl';

export const gslRootSuppressStackDemo: FormDemoDefinition = {
  title: 'Layouts / Suppress Auto-Stack',
  category: 'Layouts',
  description: 'Using _gslRoot({ suppressAutomaticStack: true }) and providing a manual horizontal layout',
  formDef: () =>
    _guiHorizontalStack([
      _guiInputs({ name: 'string', age: 'number' }),
      _guiInputs({ height: 'number' }),
    ]),
  formSelectors: () =>
    _gslRoot({ suppressAutomaticStack: true }),
};
