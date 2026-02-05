import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';

export const formConfigMixed: FormDemoDefinition = {
  title: 'Form Config Mixed',
  description: 'Form driven form formConfig making all labels blank and tweaking them',
  formConfig: {
    suppressAutomaticLabels: true,
    defaultFieldDef: ({ fieldKey, baseDef }) => {
      if (baseDef.placeholder != null) return {};
      return { placeholder: fieldKey + ' placeholder' };
    },
  },
  formDef: ()=>_guiFields({
    name: 'string',
    age: ({ error }: any) => ({
      label: error ? 'Age must be at least 18' : 'Age',
      type: 'number',
      placeholder: 'age >= 18',
      validator: {
        minimum: 18,
      },
    }),
    height: 'number',
  })
};
