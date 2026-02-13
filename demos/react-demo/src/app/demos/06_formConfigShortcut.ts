import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const formConfigShortcut: FormDemoDefinition = {
  title: 'Form Config',
  description: 'Form driven form formConfig making all labels blank',
  formConfig: {
    sensibleDefaults: {
      inputs: {
        suppressAutomaticLabels: true,
      },
    },
  },
  // formConfig2: [
  //   _gslRootLayout({
  //     allInputs: {
  //       suppressAutomaticLabels: true,
  //     },
  //     thisLayout: {
  //       decorator: {
  //         orientation: 'horizontal'
  //       }
  //     }
  //   }),
  //   _gslActionById('#submit', {
  //     onClick: () => console.log('submit clicked'),
  //   }),
  //   _gslTag('noLabels', {
  //     inputs: {
  //       suppressAutomaticLabels: true,
  //     },
  //   }),
  // ],
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
