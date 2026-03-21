import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiCustomInput, _guiCustomDisplay } from '@golemui/gui-shared';

export const customInputDemo: FormDemoDefinition = {
  title: '20. Custom Input',
  category: 'Ch4: Custom Widgets',
  description:
    'Use _guiCustomInput to render a custom input widget through the DX pipeline. '
    + 'Full input lifecycle: value binding, auto-label from path, disabled state.',
  formDef: () => [
    _guiCustomDisplay('heading', { text: 'Custom Input Demo', level: 2 }),
    _guiCustomInput('simpleInput', 'email', { label: 'Email Address' }),
    _guiCustomInput('simpleInput', 'name'),
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
