import { gui } from '@golemui/gui-shared';

// Every grid mode, and the field anatomy: labels and hints on top, controls in the middle, errors
// below. The tab itself is a stack, the grid's default.
export const gridTab = gui.layouts.grid([
  gui.displays.markdownText({
    md: '#### Row\nThe fields share the row by `size`. Their labels, controls and errors line up, whatever the length of a label.',
  }),
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('listName', {
      label: 'List Name',
      size: 2,
      hint: 'This is a hint',
      validator: { required: true },
    }),
    gui.inputs.textInput('listOwner', {
      label: 'List owner, as it appears on the team page',
      validator: { required: true },
    }),
    gui.inputs.checkbox('cb1', {
      label: 'Public list',
      hint: 'Visible to the whole workspace',
    }),
    gui.inputs.booleanInput('tg1', { label: 'Notifications' }),
  ]),
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('gridSearch', { label: 'Search members', size: 3 }),
    gui.actions.button({ label: 'Search' }),
  ]),
  gui.displays.markdownText({
    md: '#### Columns\nThree columns with a `lg` gap: the street spans two of them.',
  }),
  gui.layouts.grid(
    [
      gui.inputs.textInput('address.street', { label: 'Street', size: 2 }),
      gui.inputs.textInput('address.number', { label: 'Number' }),
      gui.inputs.textInput('address.city', { label: 'City' }),
      gui.inputs.textInput('address.state', { label: 'State' }),
      gui.inputs.textInput('address.postcode', {
        label: 'Postcode',
        validator: { required: true },
      }),
    ],
    { columns: 3, gap: 'lg' },
  ),
  gui.displays.markdownText({
    md: '#### Auto columns\nAs many columns as fit, at least 12rem wide each.',
  }),
  gui.layouts.grid(
    [
      gui.inputs.numberInput('quarters.q1', { label: 'Q1' }),
      gui.inputs.numberInput('quarters.q2', { label: 'Q2' }),
      gui.inputs.numberInput('quarters.q3', { label: 'Q3' }),
      gui.inputs.numberInput('quarters.q4', { label: 'Q4' }),
    ],
    { columns: 'auto' },
  ),
  gui.displays.markdownText({
    md: '#### Justified row\nWith `justify`, the children keep their own width: here, buttons on the right.',
  }),
  gui.layouts.horizontalGrid(
    [
      gui.actions.button({ label: 'Cancel', variant: 'outlined' }),
      gui.actions.button({ label: 'Save' }),
    ],
    { justify: 'end', gap: 'sm' },
  ),
]);
