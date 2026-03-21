import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiSelect,
  _guiTextInput,
  _guiCheckbox,
  _guiButton,
  _guiHorizontalStack,
  _guiInputs,
  _gslRoot,
  _gslStates,
  _gslInputs,
} from '@golemui/gui-shared';
import { DemoLogFn } from '../../../utils/demoLog';

const airlines = [
  { label: 'SkyWing Airlines', value: 'skywing' },
  { label: 'OceanAir', value: 'oceanair' },
  { label: 'NordJet', value: 'nordjet' },
];

const routesByAirline: Record<string, { label: string; value: string }[]> = {
  skywing: [
    { label: 'NYC → London', value: 'NYC-LHR' },
    { label: 'NYC → Tokyo', value: 'NYC-NRT' },
    { label: 'LA → Sydney', value: 'LAX-SYD' },
  ],
  oceanair: [
    { label: 'Miami → Cancún', value: 'MIA-CUN' },
    { label: 'Miami → Havana', value: 'MIA-HAV' },
  ],
  nordjet: [
    { label: 'Oslo → Reykjavik', value: 'OSL-KEF' },
    { label: 'Oslo → Helsinki', value: 'OSL-HEL' },
    { label: 'Stockholm → Tromsø', value: 'ARN-TOS' },
  ],
};

export const flightBookingDemo: FormDemoDefinition = {
  title: '42. Flight Booking',
  category: 'Ch8: States',
  description:
    'Book a flight using cascading selects, inline conditions, '
    + 'and a confirmation lock — all in one form.\n\n'
    + 'Features used:\n'
    + '• onChange event — selecting an airline populates the route dropdown via event.update\n'
    + '• Inline when — frequent flyer field appears only for SkyWing (loyalty program)\n'
    + '• Named states — "confirmed" triggered by checkbox\n'
    + '• _gslStates — disables all inputs when booking is confirmed\n'
    + '• Per-widget override — airline select stays enabled even when confirmed\n'
    + '• demoLog — onChange events logged to the Log panel',
  formDef: (log: DemoLogFn) => [
    _guiHorizontalStack([
      _guiSelect('airline', {
        options: airlines,
        label: 'Airline',
        states: { confirmed: { disabled: false } },
        onChange: (event) => {
          const selected = event.data?.airline;
          const routes = routesByAirline[selected] ?? [];
          log('onChange', `Airline changed to "${selected}" — loaded ${routes.length} routes`);
          event.update({ path: 'route', options: routes });
        },
      }),
      _guiSelect('route', {
        options: [],
        label: 'Route',
      }),
    ]),
    _guiTextInput('frequentFlyer', {
      label: 'SkyWing frequent flyer number',
      when: ['$form.airline === "skywing"', { visible: true }],
    }),
    _guiInputs({ passengerName: 'string', seatPreference: 'string' }),
    _guiCheckbox('isConfirmed', { label: 'Confirm booking' }),
    _guiButton({
      label: 'Book Flight',
      states: { confirmed: { label: 'Booking Confirmed ✓', disabled: true } },
    }),
  ],
  formSelectors: () =>
    _gslRoot(
      _gslStates('confirmed', _gslInputs({ decorator: { disabled: true } })),
    ),
  formConfig: () => ({
    states: {
      confirmed: '!!$form.isConfirmed',
    },
  }),
};
