import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const simplestTagging: FormDemoDefinition = {
  title: 'Simplest Tagging',
  description: 'Shortcuts with tags',
  formDef: ()=>_guiInputs({
    name: ['string', 'no_label'],
    age: 'number',
    height: ['number', 'no_label'],
  }),
  formConfig: {
    tags: {
      no_label: {
        decorators: {
          inputs: (currentDef) => ({
            placeholder: currentDef.path + ' I am special!',
          }),
        },
        sensibleDefaults: {
          inputs: {
            suppressAutomaticLabels: true,
          }
        }
      },
    },
  },
};
