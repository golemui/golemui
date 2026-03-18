import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiCustomDisplay, _guiInputs, _gslRoot } from '@golemui/gui-shared';

export const customDisplayDemo: FormDemoDefinition = {
  title: '28. Custom Display',
  category: 'Ch1: First Form',
  description:
    'Use _guiCustomDisplay to render a custom display widget (heading) through the DX pipeline. '
    + 'The widget loader is transported via _gslRoot({ widgetLoaders }).',
  formDef: () => [
    _guiCustomDisplay('heading', { text: 'Welcome to Custom Widgets', level: 1 }),
    _guiCustomDisplay('heading', { text: 'Fill in your details below', level: 3 }),
    _guiInputs({ firstName: 'string', lastName: 'string' }),
  ],
  formSelectors: () =>
    _gslRoot({
      widgetLoaders: {
        heading: async () =>
          (await import('../../custom-widgets/heading.component')).HeadingComponent,
      },
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
