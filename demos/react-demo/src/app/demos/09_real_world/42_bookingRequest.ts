import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui, _gslRoot, _gslStates } from '@golemui/gui-shared';

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
    gui.displays.alert({ text: 'Rooms are subject to availability. You will receive a confirmation email.', level: 'info' }),
    gui.inputs.datePicker('date', {
      label: 'Date',
      onLoad: (event) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        event.update({ path: 'date', value: tomorrow.toISOString().split('T')[0] });
      },
    }),
    gui.inputs.rangeDateInput('timeWindow', {
      label: 'Time window',
      separator: '→',
    }),
    gui.inputs.select('room', {
      options: rooms,
      label: 'Room',
    }),
    gui.inputs.numberInput('attendees', { label: 'Expected attendees' }),
    gui.inputs.currency('cateringBudget', {
      label: 'Catering budget',
      when: ['$form.attendees > 10', { visible: true }],
    }),
    gui.inputs.checkbox('isRecurring', { label: 'Recurring booking' }),
    gui.inputs.select('recurrencePattern', {
      options: recurrencePatterns,
      label: 'Recurrence pattern',
      states: { recurring: { visible: true } },
    }),
    gui.inputs.datePicker('recurrenceEnd', {
      label: 'Recurrence end date',
      states: { recurring: { visible: true } },
    }),
    gui.inputs.select('equipment', {
      options: equipmentOptions,
      label: 'Equipment needed',
    }),
    gui.inputs.textarea('notes', { label: 'Notes', placeholder: 'Any special requirements…' }),
    gui.actions.button({
      label: 'Book Room',
      states: {
        recurring: { label: 'Book Series' },
        pending: { label: 'Booking…', disabled: true },
      },
    }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('pending', gui.selectors.inputs({ override: { disabled: true } })),
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
