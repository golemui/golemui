import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';
import { _guiHorizontalStack } from '../../services/formDef/dx/gui/fields/guiStack.impl';

export const configureDynamicButton: FormDemoDefinition = {
  title: 'Should let us configure a dynamic submit button',
  description: 'Should let us configure a dynamic submit button',
  formDef: () => _guiHorizontalStack(_guiFields({a: 'string'})),
  formConfig: {
    onSubmit: (data: any) => alert(JSON.stringify(data)),
  },
  warnings: ['The button does not receive errors from other parts of the form'],
};
