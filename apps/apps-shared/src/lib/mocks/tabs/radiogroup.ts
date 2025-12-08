export const radiogroup = (): any => ({
  uid: 'tab9',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.greeting',
      label: 'Greeting',
      readonly: true,
      props: {
        hint: '"bye" should be selected',
        options: ['hello', 'bye'],
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.wrongGreeting',
      props: {
        hint: 'No option should be selected, because the provided data does not match the enum of options. A validation error should also be displayed',
        options: ['hello', 'bye'],
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.requiredUnselected',
      props: {
        hint: 'No option should be selected, and a validation error should be displayed because the field is required',
        options: ['hello', 'bye'],
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.greetingIndex',
      props: {
        hint: '"bye.2" should be selected',
        options: [
          { label: 'hello.1', value: 1 },
          { label: 'bye.2', value: 2 },
        ],
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.subregion',
      label: 'Country subregion',
      props: { hint: 'No option should be selected' },
      on: {
        load: 'getSubregionsForRadio',
        change: 'getCountriesForRadio',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'radiogroup',
      path: 'radiogroups.country',
      include: { in: ['hasSubregionRadiogroup'] },
    },
  ],
});
