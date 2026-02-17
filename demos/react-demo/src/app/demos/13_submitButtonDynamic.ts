import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const configureDynamicButton: FormDemoDefinition = {
  title: 'Should let us configure a dynamic submit button',
  description: 'Should let us configure a dynamic submit button',
  formDef: () => _guiHorizontalStack(_guiInputs({a: 'string'})),
  warnings: ['The button does not receive errors from other parts of the form'],
};
