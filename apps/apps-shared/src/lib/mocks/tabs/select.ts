export const select = (): any => ({
  uid: 'tab7',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.greeting',
      label: 'Greeting',
      readonly: true,
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: '"bye" should be selected',
        options: ['hello', 'bye'],
        placeholder: 'Please, select an option',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.wrongGreeting',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        iconPosition: 'right',
        hint: 'The disabled  "Select an Option" option should be selected, because the provided data does not match the enum of options. A validation error should also be displayed',
        options: ['hello', 'bye'],
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.requiredUnselected',
      props: {
        hint: 'The disabled  "Select an Option" option should be selected, and a validation error should be displayed because the field is required',
        options: ['hello', 'bye'],
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.greetingIndex',
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
      widget: 'select',
      path: 'selects.subregion',
      label: 'Country subregion',
      props: { hint: 'The disabled  "Select an Option" option should be selected' },
      on: {
        load: 'getSubregionsForSelect',
        change: 'getCountriesForSelect',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.country',
      include: { in: ['hasSubregionSelect'] },
    },
  ],
});
