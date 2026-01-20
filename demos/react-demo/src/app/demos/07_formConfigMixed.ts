import { FormDemoDefinition } from '../formRegistry.domain';

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
  formDef: {
    name: 'string',
    age: ({ error }: any) => ({
      label: !error ? 'Age must be at least 18' : 'Age',
      type: 'number',
      placeholder: 'age >= 18',
      validator: {
        minimum: 18,
      },
    }),
    height: 'number',
  },
};
