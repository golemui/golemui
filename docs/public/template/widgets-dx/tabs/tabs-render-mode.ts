import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.tabs(
    [
      {
        label: 'Personal',
        uid: 'tab_personal',
        children: [gui.inputs.textInput('personal_email', { label: 'Personal Email' })],
      },
      {
        label: 'Work',
        uid: 'tab_work',
        children: [gui.inputs.textInput('work_email', { label: 'Work Email' })],
      },
      {
        label: 'Other',
        uid: 'tab_other',
        children: [gui.inputs.textarea('notes', { label: 'Additional Notes' })],
      },
    ],
    {
      defaultOpen: 'tab_personal',
      renderMode: 'activeOnly',
      uid: 'tabs_render_mode',
    },
  ),
];
