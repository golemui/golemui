import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const customDisplayDemo: FormDemoDefinition = {
  title: '19. Custom Display',
  category: 'Ch4: Custom Widgets',
  description:
    'Use gui.displays.custom to render a custom display widget (heading) through the DX pipeline. '
    + 'The widget loader is transported via formConfig.widgetLoaders.',
  formDef: () => [
    gui.displays.custom('heading', { text: 'Welcome to Custom Widgets', level: 1 }),
    gui.displays.custom('heading', { text: 'Fill in your details below', level: 3 }),
    gui.inputs.textInput('firstName'),
    gui.inputs.textInput('lastName'),
  ],
  formConfig: () => ({
    widgetLoaders: {
      heading: async () =>
        (await import('../../custom-widgets/heading.component')).HeadingComponent,
    },
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
