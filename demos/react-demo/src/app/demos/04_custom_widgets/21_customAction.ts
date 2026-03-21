import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiCustomAction,
  _guiCustomDisplay,
  _guiCustomInput,
} from '@golemui/gui-shared';

export const customActionDemo: FormDemoDefinition = {
  title: '21. Custom Action',
  category: 'Ch4: Custom Widgets',
  description:
    'Use _guiCustomAction to render a custom action widget with onClick wiring. '
    + 'Click handling goes through DxResult.events, same as built-in _guiButton.',
  formDef: () => [
    _guiCustomDisplay('heading', { text: 'Custom Action Demo', level: 2 }),
    _guiCustomInput('simpleInput', 'message', { label: 'Your message' }),
    _guiCustomAction('simpleButton', {
      label: 'Send Message',
      onClick: (data: any) => alert(`Message sent: ${JSON.stringify(data)}`),
    }),
    _guiCustomAction('simpleButton', {
      label: 'Submit Form',
      onClick: 'submit',
    }),
  ],
  formConfig: () => ({
    suppressAutomaticSubmit: true,
    widgetLoaders: {
      heading: async () =>
        (await import('../../custom-widgets/heading.component')).HeadingComponent,
      simpleInput: async () =>
        (await import('../../custom-widgets/simpleInput.component')).SimpleInputComponent,
      simpleButton: async () =>
        (await import('../../custom-widgets/simpleButton.component')).SimpleButtonComponent,
    },
    onSubmit: (data: any) => alert(`Form submitted: ${JSON.stringify(data)}`),
  }),
};
