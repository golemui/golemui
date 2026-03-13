import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiRepeater, _guiInputs, _gslRoot } from '@golemui/gui-shared';

export const repeaterDemo: FormDemoDefinition = {
  title: '23. Repeater',
  category: 'Ch1: First Form',
  description:
    'A data-bound container that stamps a template per array item. '
    + 'The repeater owns an array path in the form model and clones its children for each element. '
    + 'Supports addLabel, removeLabel, limit, and nested repeaters.',
  formDef: () => [
    _guiRepeater(
      'users',
      { addLabel: 'Add User', removeLabel: 'Remove', limit: 5 },
      [
        _guiInputs({
          'users.items.name': 'string',
          'users.items.email': 'string',
        }),
      ],
    ),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
