import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';

export const inputShortcutsDemo: FormDemoDefinition = {
  title: 'Inputs / Shortcuts',
  category: 'Inputs',
  description: 'Simplest form using only string shortcuts: string, number, boolean',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
      married: 'boolean',
    }),
};
