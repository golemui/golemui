import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiAlert, _guiInputs } from '@golemui/gui-shared';

export const alertDemo: FormDemoDefinition = {
  title: '13. Alert',
  category: 'Ch2: Input Widgets',
  description:
    'Display alerts inside a form — info, warning, error, or success. '
    + 'Alerts are bare display widgets with no data path.',
  formDef: () => [
    _guiAlert({ text: 'This is an informational message.', level: 'info' }),
    _guiAlert({ text: 'Warning: check your input carefully.', level: 'warning' }),
    _guiInputs({ name: 'string', email: 'string' }),
    _guiAlert({ text: 'Something went wrong!', level: 'error' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
