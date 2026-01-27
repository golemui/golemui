import { FormDemoDefinition } from '../formRegistry.domain';

export const formConfigSimplest: FormDemoDefinition = {
  title: 'Form Config',
  description:
    'Form driven form formConfig making all labels blank, it also uses a shortcut that decorates the field under the hood',
  formConfig: {
    defaultFieldDef: ({ fieldKey }) => ({
      label: '',
      placeholder: `${fieldKey}`,
    }),
  },
  formDef: [{
    name: 'string',
    age: 'number',
    height: 'number',
  }],
};
