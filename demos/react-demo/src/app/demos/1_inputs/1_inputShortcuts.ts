import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

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
