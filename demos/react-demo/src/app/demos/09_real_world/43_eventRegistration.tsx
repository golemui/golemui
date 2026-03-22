import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiInputs,
  _guiSelect,
  _guiAccordion,
  _guiRepeater,
  _guiCheckbox,
  _guiTextInput,
  _guiTextarea,
  _guiRangeDatePicker,
  _guiMarkdown,
  _guiButton,
  _guiHorizontalStack,
  _guiDisplay,
  DxRuntimeParams,
} from '@golemui/gui-shared';
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
    'A conference registration form with hierarchical states driving visibility. '
    + 'In-person shows the Travel accordion; remote hides it. A plus-one checkbox '
    + 'reveals extra fields. A custom display shows a live cost summary. Markdown '
    + 'for special requests with a dependency on snarkdown.',
  formDef: () => [
    _guiHorizontalStack([
      _guiInputs({ fullName: 'string', email: 'string' }),
    ]),
    _guiHorizontalStack([
      _guiInputs({ company: 'string', role: 'string' }),
    ]),
    _guiSelect('attendanceMode', {
      options: attendanceModes,
      label: 'Attendance mode',
    }),
    _guiAccordion(
      {
        'Travel': [
          _guiRangeDatePicker('travelDates', {
            label: 'Arrival / Departure',
            numberOfMonths: 2,
          }),
          _guiHorizontalStack([
            _guiSelect('hotelPreference', {
              options: hotelPreferences,
              label: 'Hotel preference',
            }),
            _guiSelect('transportMode', {
              options: transportModes,
              label: 'Transport',
            }),
          ]),
        ],
      },
      {
        states: { 'attending$remote': { visible: false } },
      },
    ),
    _guiHorizontalStack([
      _guiSelect('dietary', {
        options: dietaryOptions,
        label: 'Dietary requirements',
      }),
      _guiTextarea('accessibilityNeeds', { label: 'Accessibility needs' }),
    ]),
    _guiCheckbox('hasPlusOne', { label: 'Bringing a plus-one' }),
    _guiTextInput('plusOneName', {
      label: 'Plus-one name',
      when: ['!!$form.hasPlusOne', { visible: true }],
    }),
    _guiSelect('plusOneDietary', {
      options: dietaryOptions,
      label: 'Plus-one dietary',
      when: ['!!$form.hasPlusOne', { visible: true }],
    }),
    _guiRepeater(
      'additionalGuests',
      { addLabel: 'Add guest', removeLabel: 'Remove' },
      [
        _guiHorizontalStack([
          _guiInputs({ guestName: 'string', guestEmail: 'string' }),
        ]),
        _guiSelect('ticketType', {
          options: ticketTypes,
          label: 'Ticket type',
        }),
      ],
    ),
    _guiMarkdown('specialRequests', {
      label: 'Special requests',
      tools: ['B', 'I', 'L'],
      placeholder: 'Any special requirements…',
    }),
    _guiDisplay((params: DxRuntimeParams) => {
      const form = params?.$form;
      if (!form?.attendanceMode) return null;
      const base = baseCost[form.attendanceMode] ?? 0;
      const plusOne = form.hasPlusOne ? 150 : 0;
      const guests = Array.isArray(form.additionalGuests?.items)
        ? form.additionalGuests.items.length * 200
        : 0;
      const total = base + plusOne + guests;
      return (
        <div style={{ padding: '0.75rem', background: '#f0f4f8', borderRadius: '4px' }}>
          <strong>Estimated cost:</strong> ${total}
          <span style={{ color: '#666', marginLeft: '0.5rem' }}>
            (base: ${base}{plusOne > 0 ? `, plus-one: $${plusOne}` : ''}{guests > 0 ? `, guests: $${guests}` : ''})
          </span>
        </div>
      );
    }),
    _guiButton({
      label: 'Register',
      states: {
        'attending$inPerson': { label: 'Register — In Person' },
        'attending$remote': { label: 'Register — Remote' },
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
