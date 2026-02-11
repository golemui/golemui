import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const formConfigMixed: FormDemoDefinition = {
  title: 'Form Config Mixed',
  description: 'Form driven form formConfig making all labels blank and tweaking them',
  formConfig: {
    sensibleDefaults: {
      inputs: {
        suppressAutomaticLabels: true,
      },
    },
    decorators:{
      inputs: (baseDef) => {
        return { placeholder: baseDef.path + ' placeholder' };
      },
    }
  },
  formDef: ()=>_guiInputs({
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
