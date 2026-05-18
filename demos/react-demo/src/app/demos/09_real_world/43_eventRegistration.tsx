import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui, type DxRuntimeParams } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

const attendanceModes = [
  { label: 'In-person', value: 'inPerson' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
];

const hotelPreferences = [
  { label: 'No preference', value: 'none' },
  { label: 'Budget', value: 'budget' },
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
];

const transportModes = [
  { label: 'Flight', value: 'flight' },
  { label: 'Train', value: 'train' },
  { label: 'Car', value: 'car' },
  { label: 'Other', value: 'other' },
];

const dietaryOptions = [
  { label: 'No restrictions', value: 'none' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-free', value: 'gluten-free' },
  { label: 'Halal', value: 'halal' },
];

const ticketTypes = [
  { label: 'Standard', value: 'standard' },
  { label: 'VIP', value: 'vip' },
  { label: 'Speaker', value: 'speaker' },
];

const baseCost: Record<string, number> = {
  inPerson: 350,
  remote: 50,
  hybrid: 250,
};

export const eventRegistrationDemo: FormDemoDefinition = {
  title: '43. Event Registration',
  category: 'Ch9: Real World',
  description:
    'A conference registration form with hierarchical states driving visibility. ' +
    'In-person shows the Travel accordion; remote hides it. A plus-one checkbox ' +
    'reveals extra fields. A custom display shows a live cost summary. Markdown ' +
    'for special requests with a dependency on snarkdown.',
  formDef: () => [
    gui.layouts.horizontalFlex([gui.inputs.textInput('fullName'), gui.inputs.textInput('email')]),
    gui.layouts.horizontalFlex([gui.inputs.textInput('company'), gui.inputs.textInput('role')]),
    gui.inputs.select('attendanceMode', {
      options: attendanceModes,
      label: 'Attendance mode',
    }),
    gui.layouts.accordion(
      [
        {
          label: 'Travel',
          children: [
            gui.inputs.rangeDatePicker('travelDates', {
              label: 'Arrival / Departure',
              numberOfMonths: 2,
            }),
            gui.layouts.horizontalFlex([
              gui.inputs.select('hotelPreference', {
                options: hotelPreferences,
                label: 'Hotel preference',
              }),
              gui.inputs.select('transportMode', {
                options: transportModes,
                label: 'Transport',
              }),
            ]),
          ],
        },
      ],
      {
        states: { 'attending:remote': { visible: false } },
      },
    ),
    gui.layouts.horizontalFlex([
      gui.inputs.select('dietary', {
        options: dietaryOptions,
        label: 'Dietary requirements',
      }),
      gui.inputs.textarea('accessibilityNeeds', { label: 'Accessibility needs' }),
    ]),
    gui.inputs.checkbox('hasPlusOne', { label: 'Bringing a plus-one' }),
    gui.inputs.textInput('plusOneName', {
      label: 'Plus-one name',
      include: { when: '!!$form.hasPlusOne' },
    }),
    gui.inputs.select('plusOneDietary', {
      options: dietaryOptions,
      label: 'Plus-one dietary',
      include: { when: '!!$form.hasPlusOne' },
    }),
    gui.inputs.repeater('additionalGuests', {
      addLabel: 'Add guest',
      removeLabel: 'Remove',
      template: [
        gui.layouts.horizontalFlex([
          gui.inputs.textInput('guestName'),
          gui.inputs.textInput('guestEmail'),
        ]),
        gui.inputs.select('ticketType', {
          options: ticketTypes,
          label: 'Ticket type',
        }),
      ],
    }),
    gui.inputs.markdown('specialRequests', {
      label: 'Special requests',
      tools: ['B', 'I', 'L'],
      placeholder: 'Any special requirements…',
    }),
    gui.displays.display((params: DxRuntimeParams) => {
      const form = params?.$form;
      if (!form?.attendanceMode) return null;
      const base = baseCost[form.attendanceMode] ?? 0;
      const plusOne = form.hasPlusOne ? 150 : 0;
      const guests = Array.isArray(form.additionalGuests?.items)
        ? form.additionalGuests.items.length * 200
        : 0;
      const total = base + plusOne + guests;
      return (
        <div style={{ padding: '0.75rem', background: 'f0f4f8', borderRadius: '4px' }}>
          <strong>Estimated cost:</strong> ${total}
          <span style={{ color: '#666', marginLeft: '0.5rem' }}>
            (base: ${base}
            {plusOne > 0 ? `, plus-one: $${plusOne}` : ''}
            {guests > 0 ? `, guests: $${guests}` : ''})
          </span>
        </div>
      );
    }),
    gui.actions.button({
      label: 'Register',
      states: {
        'attending:inPerson': { label: 'Register — In Person' },
        'attending:remote': { label: 'Register — Remote' },
      },
    }),
  ],
  formConfig: () => ({
    states: {
      attending: '$form.attendanceMode',
    },
    dependencies: { markdown: { parse: snarkdown } },
    onSubmit: (data: any) => console.log('Registration submitted:', data),
  }),
};
