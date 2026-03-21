import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiInputs,
  _guiTextInput,
  _guiCheckbox,
  _guiSelect,
  _guiVerticalStack,
  _guiButton,
} from '@golemui/gui-shared';

const ageGroups = [
  { label: 'Under 18', value: 'minor' },
  { label: '18 or older', value: 'adult' },
];

export const hierarchicalStatesDemo: FormDemoDefinition = {
  title: '38. Hierarchical States with $',
  category: 'Ch8: States',
  description:
    'A registration form with hierarchical states: "register", "register$adult", '
    + 'and "register$minor". The $ separator creates parent/child AND logic — '
    + 'activating "register$adult" requires both "register" AND "register$adult" '
    + 'expressions to be true. Check the registration box, then select an age group '
    + 'to see different overrides appear.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiCheckbox('wantsRegistration', { label: 'Register for account' }),
    _guiVerticalStack({
      children: [
        _guiSelect('ageGroup', {
          options: ageGroups,
          label: 'Age group',
        }),
        _guiTextInput('guardianName', {
          label: 'Guardian name',
          states: { register$minor: { visible: true } },
        }),
        _guiTextInput('driversLicense', {
          label: 'Drivers license number',
          states: { register$adult: { visible: true } },
        }),
      ],
      states: { register: { visible: true } },
    }),
    _guiButton({
      label: 'Continue',
      states: {
        register: { label: 'Register' },
        register$adult: { label: 'Register (adult)' },
        register$minor: { label: 'Register (minor — guardian required)' },
      },
    }),
  ],
  formConfig: () => ({
    states: {
      register: '!!$form.wantsRegistration',
      register$adult: '$form.ageGroup === "adult"',
      register$minor: '$form.ageGroup === "minor"',
    },
  }),
};
