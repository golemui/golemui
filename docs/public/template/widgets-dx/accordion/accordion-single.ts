import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.accordion([
    {
      label: 'First Section',
      uid: 'sec1',
      children: [
        gui.inputs.textInput('f1', {
          label: 'Field 1',
        }),
      ],
    },
    {
      label: 'Second Section',
      uid: 'sec2',
      children: [
        gui.inputs.textInput('f2', {
          label: 'Field 2',
        }),
      ],
    },
  ], {
    singleOpen: true,
    uid: 'accordion_single',
  }),
];
