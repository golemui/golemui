import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const alertDemo: FormDemoDefinition = {
  title: '13. Alert',
  category: 'Ch2: Input Widgets',
  description:
    'Display alerts inside a form — info, warning, error, or success. ' +
    'Alerts are bare display widgets with no data path.',
  formDef: () => [
    gui.displays.alert({ text: 'This is an informational message.', level: 'info' }),
    gui.displays.alert({ text: 'Warning: check your input carefully.', level: 'warning' }),
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email'),
    gui.displays.alert({ text: 'Something went wrong!', level: 'error' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
