import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.repeater('teams', {
    addLabel: 'Add Team',
    removeLabel: 'Remove Team',
    label: 'Teams',
    uid: 'team_repeater',
    template: [
      gui.layouts.flex([
        gui.inputs.textInput('teams.items.teamName', {
          label: 'Team Name',
        }),
        gui.inputs.repeater('teams.items.members', {
          addLabel: 'Add Member',
          removeLabel: 'Remove Member',
          label: 'Members',
          uid: 'member_repeater',
          template: [
            gui.layouts.flex([
              gui.inputs.textInput('teams.items.members.items.memberName', {
                label: 'Member Name',
              }),
            ]),
          ],
        }),
      ], {
        direction: 'column',
      }),
    ],
  }),
];
