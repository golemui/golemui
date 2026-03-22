import * as Core from '@golemui/core';
import { Example } from './types';

const data = {};

const TEAMS_REPEATER_PATH = 'repeaters.teams';
const DEVELOPERS_REPEATER_PATH = 'repeaters.teams.items.developers';
const SKILLS_REPEATER_PATH = 'repeaters.teams.items.developers.items.skills';
const SUBMIT_BUTTON_UID = 'submitBtn';

const getFormDefinition = () =>
  Core.defineForm({
    states: {
      limitReached: `$form.repeaters?.teams?.[0]?.developers?.length === 5`,
      isApple: `$form.company === 'appl'`,
      companyHasBeenPicked: `$form.company !== undefined`,
    },
    form: [
      {
        uid: '',
        kind: 'input',
        type: 'select',
        path: 'company',
        label: 'Company',
        props: {
          options: ['msf', 'appl'],
        },
      },
      {
        uid: '',
        kind: 'layout',
        type: 'flex',
        children: [
          {
            uid: 'teamRepeater',
            kind: 'input',
            type: 'repeater',
            path: TEAMS_REPEATER_PATH,
            props: {
              addLabel: 'Add new team',
              'addLabel.limitReached': `Limit Reached, you can't add more`,
              removeLabel: 'Remove team',
              template: {
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    kind: 'display',
                    type: 'alert',
                    props: {
                      'text.isApple': 'Company is Apple',
                      text: 'Company is Msoft',
                    },
                    include: { in: ['companyHasBeenPicked'] },
                  },
                  {
                    uid: 'teamName',
                    kind: 'input',
                    type: 'textinput',
                    path: `${TEAMS_REPEATER_PATH}.items.teamName`,
                    label: 'Team Name',
                    validator: { type: 'string', required: true },
                  },
                  {
                    uid: 'devRepeater',
                    kind: 'input',
                    type: 'repeater',
                    path: DEVELOPERS_REPEATER_PATH,
                    props: {
                      addLabel: 'Add new developer',
                      removeLabel: 'Remove developer',
                      limit: 5,
                      template: {
                        kind: 'layout',
                        type: 'flex',
                        children: [
                          {
                            uid: 'firstName',
                            kind: 'input',
                            type: 'textinput',
                            label: 'First Name',
                            path: `${DEVELOPERS_REPEATER_PATH}.items.firstName`,
                            validator: { type: 'string', required: true },
                          },
                          {
                            uid: 'lastName',
                            kind: 'input',
                            type: 'textinput',
                            label: 'Last Name',
                            path: `${DEVELOPERS_REPEATER_PATH}.items.lastName`,
                          },
                          {
                            uid: 'skillRepeater',
                            kind: 'input',
                            type: 'repeater',
                            path: SKILLS_REPEATER_PATH,
                            props: {
                              addLabel: 'Add new skill',
                              removeLabel: 'Remove skill',
                              template: {
                                kind: 'layout',
                                type: 'flex',
                                children: [
                                  {
                                    uid: 'developerSkill',
                                    kind: 'input',
                                    type: 'textinput',
                                    path: `${SKILLS_REPEATER_PATH}.items.skill`,
                                    label: 'Skill',
                                    validator: { type: 'string', required: true },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      {
        uid: SUBMIT_BUTTON_UID,
        kind: 'action',
        type: 'button',
        label: 'Login',
        on: {
          click: 'submit',
        },
      },
    ],
  });

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tests: Example = {
  data,
  form: getFormDefinition(),
  resources,
};
