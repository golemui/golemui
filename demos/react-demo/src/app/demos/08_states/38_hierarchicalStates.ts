import { FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

const ageGroups = [
  { label: 'Under 18', value: 'minor' },
  { label: '18 or older', value: 'adult' },
];

export const hierarchicalStatesDemo: FormDemoDefinition = {
  title: '38. Hierarchical States',
  category: 'Ch8: States',
  description:
    'A registration form with hierarchical states: "register", "register:adult", ' +
    'and "register:minor". The ":" separator creates parent/child AND logic — ' +
    'activating "register:adult" requires both "register" AND "register:adult" ' +
    'expressions to be true. Check the registration box, then select an age group ' +
    'to see different overrides appear.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.checkbox('wantsRegistration', { label: 'Register for account' }),
    gui.layouts.verticalFlex(
      [
        gui.inputs.select('ageGroup', {
          options: ageGroups,
          label: 'Age group',
        }),
        gui.inputs.textInput('guardianName', {
          label: 'Guardian name',
          states: { 'register:minor': { visible: true } },
        }),
        gui.inputs.textInput('driversLicense', {
          label: 'Drivers license number',
          states: { 'register:adult': { visible: true } },
        }),
      ],
      { states: { register: { visible: true } } },
    ),
    gui.actions.button({
      label: 'Continue',
      states: {
        register: { label: 'Register' },
        'register:adult': { label: 'Register (adult)' },
        'register:minor': { label: 'Register (minor — guardian required)' },
      },
    }),
  ],
  formConfig: () => ({
    states: {
      register: '!!$form.wantsRegistration',
      'register:adult': '$form.ageGroup === "adult"',
      'register:minor': '$form.ageGroup === "minor"',
    },
  }),
};
