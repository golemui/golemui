import { gui } from '@golemui/gui-shared';

export const repeaterTab = gui.layouts.grid([
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
      gui.layouts.horizontalGrid([
        gui.inputs.textInput('firstName', { size: 5, validator: { required: true } }),
        gui.inputs.textInput('lastName', { size: 5 }),
        gui.actions.menu({
          uid: 'userRowMenu',
          ariaLabel: 'Row actions',
          icon: 'more_vert',
          variant: 'outlined',
          placement: 'bottom-end',
          items: [
            { label: 'Edit', value: 'edit' },
            { label: 'Duplicate', value: 'duplicate' },
          ],
          onClick: () => 'repeaterRowAction',
        }),
      ]),
    ],
    validator: { required: true, minItems: 1, maxItems: 2 },
  }),
  gui.displays.alert({
    uid: 'repeaterRowActionResult',
    text: 'Pick an action in the menu of a row.',
    level: 'info',
  }),
]);
