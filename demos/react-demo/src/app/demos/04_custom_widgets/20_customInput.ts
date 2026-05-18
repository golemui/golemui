import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const customInputDemo: FormDemoDefinition = {
  title: '20. Custom Input',
  category: 'Ch4: Custom Widgets',
  description:
    'Use gui.inputs.custom to render a custom input widget through the DX pipeline. ' +
    'Full input lifecycle: value binding, auto-label from path, disabled state.',
  formDef: () => [
    gui.displays.custom('heading', { text: 'Custom Input Demo', level: 2 }),
    gui.inputs.custom('simpleInput', 'email', { label: 'Email Address' }),
    gui.inputs.custom('simpleInput', 'name'),
  ],
  formConfig: () => ({
    widgetLoaders: {
      heading: async () =>
        (await import('../../custom-widgets/heading.component')).HeadingComponent,
      simpleInput: async () =>
        (await import('../../custom-widgets/simpleInput.component')).SimpleInputComponent,
    },
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
