import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const tabsAndListDemo: FormDemoDefinition = {
  title: '15. Tabs & List',
  category: 'Ch3: Compound Widgets',
  description: 'Tabbed layouts with nested content and list inputs with item templates.',
  formDef: () => [
    gui.layouts.tabs([
      {
        label: 'Personal',
        children: [
          gui.inputs.textInput('firstName'),
          gui.inputs.textInput('lastName'),
          gui.inputs.dateInput('birthday'),
        ],
      },
      {
        label: 'Preferences',
        children: [
          gui.inputs.list('favoriteColors', {
            items: [
              { template: 'Red', value: 'red' },
              { template: 'Blue', value: 'blue' },
              { template: 'Green', value: 'green' },
            ],
          }),
          gui.inputs.checkbox('newsletter'),
        ],
      },
    ]),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
