import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiTabs,
  _guiList,
  _guiInputs,
  _guiDateInput,
  _guiCheckbox,
} from '@golemui/gui-shared';

export const tabsAndListDemo: FormDemoDefinition = {
  title: '15. Tabs & List',
  category: 'Ch3: Compound Widgets',
  description:
    'Tabbed layouts with nested content and list inputs with item templates.',
  formDef: () => [
    _guiTabs({
      Personal: [
        _guiInputs({ firstName: 'string', lastName: 'string' }),
        _guiDateInput('birthday'),
      ],
      Preferences: [
        _guiList('favoriteColors', {
          items: [
            { template: 'Red', value: 'red' },
            { template: 'Blue', value: 'blue' },
            { template: 'Green', value: 'green' },
          ],
        }),
        _guiCheckbox('newsletter'),
      ],
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
