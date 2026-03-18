import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiCustomInput, _guiCustomDisplay, _gslRoot } from '@golemui/gui-shared';

export const customInputDemo: FormDemoDefinition = {
  title: '29. Custom Input',
  category: 'Ch1: First Form',
  description:
    'Use _guiCustomInput to render a custom input widget through the DX pipeline. '
    + 'Full input lifecycle: value binding, auto-label from path, disabled state.',
  formDef: () => [
    _guiCustomDisplay('heading', { text: 'Custom Input Demo', level: 2 }),
    _guiCustomInput('simpleInput', 'email', { label: 'Email Address' }),
    _guiCustomInput('simpleInput', 'name'),
  ],
  formSelectors: () =>
    _gslRoot({
      widgetLoaders: {
        heading: async () =>
          (await import('../../custom-widgets/heading.component')).HeadingComponent,
        simpleInput: async () =>
          (await import('../../custom-widgets/simpleInput.component')).SimpleInputComponent,
      },
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
