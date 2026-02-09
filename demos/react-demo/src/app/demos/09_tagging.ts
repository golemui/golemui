import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const simplestTagging: FormDemoDefinition = {
  title: 'Simplest Tagging',
  description: 'Shortcuts with tags',
  formDef: ()=>_guiFields({
    name: ['string', 'no_label'],
    age: 'number',
    height: ['number', 'no_label'],
  }),
  formConfig: {
    tags: {
      no_label: {
        suppressAutomaticLabels: true,
        defaultInputDef: (currentDef) => ({
          placeholder: currentDef.path + ' I am special!',
        }),
      },
    },
  },
};
