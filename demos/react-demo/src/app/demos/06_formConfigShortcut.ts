import { FormDemoDefinition } from '../formRegistry.domain';

export const formConfigShortcut: FormDemoDefinition = {
  title: 'Form Config',
  description: 'Form driven form formConfig making all labels blank',
  formConfig: {
    suppressAutomaticLabels: true,
  },
  formDef: {
    name: 'string',
    age: 'number',
    height: 'number',
  },
};
