import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const customActionDemo: FormDemoDefinition = {
  title: '21. Custom Action',
  category: 'Ch4: Custom Widgets',
  description:
    'Use gui.actions.custom to render a custom action widget with onClick wiring. '
    + 'Click handling goes through DxResult.events, same as built-in gui.actions.button.',
  formDef: () => [
    gui.displays.custom('heading', { text: 'Custom Action Demo', level: 2 }),
    gui.inputs.custom('simpleInput', 'message', { label: 'Your message' }),
    gui.actions.custom('simpleButton', {
      label: 'Send Message',
      onClick: (data: any) => alert(`Message sent: ${JSON.stringify(data)}`),
    }),
    gui.actions.custom('simpleButton', {
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
