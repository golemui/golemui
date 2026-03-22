import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiDatePicker,
  _guiRangeDateInput,
  _guiSelect,
  _guiNumberInput,
  _guiCheckbox,
  _guiTextarea,
  _guiCurrency,
  _guiButton,
  _guiAlert,
  _gslRoot,
  _gslStates,
  _gslInputs,
} from '@golemui/gui-shared';

const rooms = [
  { label: 'Room A — 4 seats', value: 'room-a' },
  { label: 'Room B — 8 seats', value: 'room-b' },
  { label: 'Room C — 20 seats', value: 'room-c' },
  { label: 'Auditorium — 100 seats', value: 'auditorium' },
];

const recurrencePatterns = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

const equipmentOptions = [
  { label: 'Projector', value: 'projector' },
  { label: 'Whiteboard', value: 'whiteboard' },
  { label: 'Video conferencing', value: 'video' },
  { label: 'Microphone', value: 'mic' },
];

export const bookingRequestDemo: FormDemoDefinition = {
  title: '42. Booking Request',
  category: 'Ch9: Real World',
  description:
    'An internal meeting room booking form. A recurring checkbox reveals recurrence '
    + 'options via visibility state. Catering budget appears when attendees exceed a '
    + 'threshold. A pending state disables the form on submission. onLoad sets defaults.',
  formDef: () => [
    _guiAlert({ text: 'Rooms are subject to availability. You will receive a confirmation email.', level: 'info' }),
    _guiDatePicker('date', {
      label: 'Date',
      onLoad: (event) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        event.update({ path: 'date', value: tomorrow.toISOString().split('T')[0] });
      },
    }),
    _guiRangeDateInput('timeWindow', {
      label: 'Time window',
      separator: '→',
    }),
    _guiSelect('room', {
      options: rooms,
      label: 'Room',
    }),
    _guiNumberInput('attendees', { label: 'Expected attendees' }),
    _guiCurrency('cateringBudget', {
      label: 'Catering budget',
      when: ['$form.attendees > 10', { visible: true }],
    }),
    _guiCheckbox('isRecurring', { label: 'Recurring booking' }),
    _guiSelect('recurrencePattern', {
      options: recurrencePatterns,
      label: 'Recurrence pattern',
      states: { recurring: { visible: true } },
    }),
    _guiDatePicker('recurrenceEnd', {
      label: 'Recurrence end date',
      states: { recurring: { visible: true } },
    }),
    _guiSelect('equipment', {
      options: equipmentOptions,
      label: 'Equipment needed',
    }),
    _guiTextarea('notes', { label: 'Notes', placeholder: 'Any special requirements…' }),
    _guiButton({
      label: 'Book Room',
      states: {
        recurring: { label: 'Book Series' },
        pending: { label: 'Booking…', disabled: true },
      },
    }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('pending', _gslInputs({ decorator: { disabled: true } })),
    ),
  formConfig: () => ({
    states: {
      recurring: '!!$form.isRecurring',
      pending: '!!$form._pending',
    },
    onSubmit: (data: any) => {
      console.log('Booking submitted:', data);
    },
  }),
};
