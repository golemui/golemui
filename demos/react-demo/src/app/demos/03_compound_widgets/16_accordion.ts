import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const accordionDemo: FormDemoDefinition = {
  title: '16. Accordion',
  category: 'Ch3: Compound Widgets',
  description:
    'Collapsible sections with nested content. '
    + 'Similar to tabs but sections expand/collapse independently. '
    + 'Supports singleOpen, defaultOpen, and renderMode.',
  formDef: () => [
    gui.layouts.accordion(
      [
        {
          label: 'Personal Information',
          children: [gui.inputs.textInput('firstName'), gui.inputs.textInput('lastName')],
        },
        {
          label: 'Contact Details',
          children: [gui.inputs.textInput('email'), gui.inputs.textInput('phone')],
        },
        {
          label: 'Preferences',
          children: [
            gui.inputs.checkbox('newsletter'),
            gui.inputs.checkbox('notifications'),
          ],
        },
      ],
      { singleOpen: true, defaultOpen: { 'personal-information': true } },
    ),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
