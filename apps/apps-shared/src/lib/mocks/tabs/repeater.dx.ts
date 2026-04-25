import { gui } from '@golemui/gui-shared';

export const repeaterTab = gui.layouts.flex([
  gui.inputs.repeater('repeaters.users', {
    label: 'Team Members',
    title: 'Developer',
    addButtonIcon: 'person_add',
    removeButtonIcon: 'delete',
    addLabel: 'Add new developer',
    removeLabel: 'Delete',
    limit: 5,
    states: {
      limitReached: { addLabel: `'Limit Reached, you can't add more'` },
    },
    template: [
      gui.layouts.grid([
        gui.inputs.textInput('firstName', { validator: { required: true } }),
        gui.inputs.textInput('lastName'),
      ]),
    ],
    // TODO: validator on repeater — DX type gap
  }),
]);
