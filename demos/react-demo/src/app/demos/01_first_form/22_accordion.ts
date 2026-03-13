import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiAccordion, _guiInputs, _guiCheckbox, _gslRoot } from '@golemui/gui-shared';

export const accordionDemo: FormDemoDefinition = {
  title: '22. Accordion',
  category: 'Ch1: First Form',
  description:
    'Collapsible sections with nested content. '
    + 'Similar to tabs but sections expand/collapse independently. '
    + 'Supports singleOpen, defaultOpen, and renderMode.',
  formDef: () => [
    _guiAccordion(
      {
        'Personal Information': [
          _guiInputs({ firstName: 'string', lastName: 'string' }),
        ],
        'Contact Details': [
          _guiInputs({ email: 'string', phone: 'string' }),
        ],
        'Preferences': [
          _guiCheckbox('newsletter'),
          _guiCheckbox('notifications'),
        ],
      },
      { singleOpen: true, defaultOpen: { 'personal-information': true } },
    ),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
