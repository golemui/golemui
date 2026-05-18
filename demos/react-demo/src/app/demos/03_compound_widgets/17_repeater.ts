import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const repeaterDemo: FormDemoDefinition = {
  title: '17. Repeater',
  category: 'Ch3: Compound Widgets',
  description:
    'A data-bound container that stamps a template per array item. ' +
    'The repeater owns an array path in the form model and clones its children for each element. ' +
    'Supports addLabel, removeLabel, limit, and nested repeaters.',
  formDef: () => [
    gui.inputs.repeater('users', {
      addLabel: 'Add User',
      removeLabel: 'Remove',
      limit: 5,
      template: [gui.inputs.textInput('name'), gui.inputs.textInput('email')],
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
