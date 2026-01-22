import { FormDemoDefinition } from '../formRegistry.domain';

export const simplestTagging: FormDemoDefinition = {
  title: 'Simplest Tagging',
  description: 'Shortcuts with tags',
  formDef: {
    name: ['string', 'no_label'],
    age: 'number',
    height: ['number', 'no_label'],
  },
  formConfig: {
    tags: {
      no_label: {
        suppressAutomaticLabels: true,
        defaultFieldDef: ({ currentDef }) => ({
          placeholder: currentDef.placeholder + ' I am special!',
        }),
      },
    },
  },
};
