import { gui } from '@golemui/gui-shared';

const toppings = [
  { label: 'Cheese', value: 'cheese' },
  { label: 'Ham', value: 'ham' },
  { label: 'Olives', value: 'olives' },
  { label: 'Mushrooms', value: 'mushrooms' },
];

export const checkboxGroupTab = gui.layouts.grid([
  gui.inputs.checkboxGroup('checkboxGroups.toppings', {
    label: 'Toppings',
    hint: "The value keeps the options' order, whatever order you check them in",
    options: toppings,
  }),
  gui.inputs.checkboxGroup('checkboxGroups.favourites', {
    label: 'Favourite toppings',
    hint: 'At most two: check a third and the error shows',
    options: toppings,
    validator: { maxItems: 2, messages: { maxItems: 'Pick at most two toppings' } },
  }),
  gui.inputs.checkboxGroup('checkboxGroups.extras', {
    label: 'Extras',
    hint: 'Required, and at most two: errors show once it is touched',
    options: ['Napkins', 'Cutlery', 'Sauce'],
    validator: {
      required: true,
      maxItems: 2,
      messages: {
        invalid: 'Pick at least one extra',
        required: 'Pick at least one extra',
        maxItems: 'Pick at most two extras',
      },
    },
  }),
  gui.inputs.checkboxGroup('checkboxGroups.days', {
    label: 'Delivery days',
    hint: 'A row of options',
    options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    direction: 'row',
    defaultValue: ['Mon', 'Wed'],
  }),
  gui.inputs.checkboxGroup('checkboxGroups.disabled', {
    label: 'Disabled',
    options: toppings,
    disabled: true,
    defaultValue: ['ham'],
  }),
  gui.inputs.checkboxGroup('checkboxGroups.readonly', {
    label: 'Read-only',
    options: toppings,
    readonly: true,
    defaultValue: ['cheese', 'olives'],
  }),
  // A checkbox group lines up with the fields beside it.
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('checkboxGroups.name', { label: 'Name' }),
    gui.inputs.checkboxGroup('checkboxGroups.contact', {
      label: 'Contact me by',
      options: ['Email', 'Phone'],
      direction: 'row',
    }),
  ]),
]);
