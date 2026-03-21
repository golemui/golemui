import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiInputs,
  _guiTextInput,
  _guiSelect,
  _guiCheckbox,
  _guiButton,
  _guiVerticalStack,
  _guiHorizontalStack,
  _gslRoot,
  _gslStates,
  _gslInputs,
} from '@golemui/gui-shared';

const ticketTypes = [
  { label: 'General Admission', value: 'general' },
  { label: 'VIP', value: 'vip' },
  { label: 'Speaker', value: 'speaker' },
];

export const eventRegistrationDemo: FormDemoDefinition = {
  title: '40. Event Registration',
  category: 'Ch8: States',
  description:
    'A conference registration form combining named states, inline when conditions, '
    + 'state-driven visibility, and _gslStates broad overrides.\n\n'
    + 'Features used:\n'
    + '• Named states — "confirmed" locks the form via _gslStates\n'
    + '• Inline when — dietary preferences appear only for VIP tickets\n'
    + '• Inline when — talk title appears only for Speaker tickets\n'
    + '• State visibility — billing address section toggled by checkbox\n'
    + '• _gslStates — disables all inputs when confirmed\n'
    + '• Per-widget state override — Submit button label changes to "Confirmed ✓"',
  formDef: () => [
    _guiHorizontalStack([
      _guiInputs({ fullName: 'string', email: 'string' }),
    ]),
    _guiSelect('ticketType', {
      options: ticketTypes,
      label: 'Ticket type',
    }),
    _guiTextInput('dietaryNeeds', {
      label: 'Dietary preferences',
      when: ['$form.ticketType === "vip"', { visible: true }],
    }),
    _guiTextInput('talkTitle', {
      label: 'Talk title',
      when: ['$form.ticketType === "speaker"', { visible: true }],
    }),
    _guiCheckbox('showBilling', { label: 'Add billing address' }),
    _guiVerticalStack({
      children: [
        _guiInputs({ streetAddress: 'string', city: 'string', zipCode: 'string' }),
      ],
      states: { billing: { visible: true } },
    }),
    _guiCheckbox('isConfirmed', { label: 'Confirm registration' }),
    _guiButton({
      label: 'Register',
      states: { confirmed: { label: 'Confirmed ✓', disabled: true } },
    }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('confirmed', _gslInputs({ decorator: { disabled: true } })),
    ),
  formConfig: () => ({
    states: {
      billing: '!!$form.showBilling',
      confirmed: '!!$form.isConfirmed',
    },
  }),
};
