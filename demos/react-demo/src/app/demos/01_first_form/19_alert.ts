import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiAlert, _guiInputs, _gslRoot } from '@golemui/gui-shared';

export const alertDemo: FormDemoDefinition = {
  title: '19. Alert',
  category: 'Ch1: First Form',
  description:
    'Display alerts inside a form — info, warning, error, or success. '
    + 'Alerts are bare display widgets with no data path.',
  formDef: () => [
    _guiAlert({ text: 'This is an informational message.', level: 'info' }),
    _guiAlert({ text: 'Warning: check your input carefully.', level: 'warning' }),
    _guiInputs({ name: 'string', email: 'string' }),
    _guiAlert({ text: 'Something went wrong!', level: 'error' }),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
