import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.calendar('calendar', {
      label: 'Calendar',
    }),
    gui.layouts.flex([
      gui.inputs.textInput('username', {
        label: 'Username',
      }),
      gui.inputs.password('password', {
        label: 'Password',
      }),
    ], {
      align: 'center',
      justify: 'start',
      direction: 'column',
    }),
  ], {
    direction: 'row',
    align: 'center',
    justify: 'stretch',
  }),
  gui.layouts.flex([
    gui.inputs.textInput('textinput', {
      label: 'Textinput',
    }),
    gui.inputs.numberInput('number', {
      label: 'Number',
    }),
    gui.inputs.checkbox('checkbox', {
      label: 'Checkbox cool',
    }),
  ], {
    direction: 'row',
    align: 'start',
    justify: 'end',
  }),
];
