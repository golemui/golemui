import { gui } from '@golemui/gui-shared';

// `tagsAnd` — only widgets carrying ALL of the listed tags match.
export const multiValueAndDemo = {
  data: {},
  form: [
    gui.inputs.textInput('email',       { label: 'Email' },         ['identity', 'required']),
    gui.inputs.textInput('username',    { label: 'Username' },      ['identity', 'required']),
    gui.inputs.textInput('displayName', { label: 'Display name' },  ['identity']),
    gui.inputs.textInput('bio',         { label: 'Short bio' },     ['required']),
    gui.inputs.textInput('nickname',    { label: 'Nickname' }),
  ],
  selectors: [
    gui.selectors.tagsAnd(['identity', 'required']).textInputs({
      override: { hint: '⚠ Required identity field' },
    }),
  ],
  resources: {},
};

// `tagsOr` — widgets carrying ANY of the listed tags match.
export const multiValueOrDemo = {
  data: {},
  form: [
    gui.inputs.textInput('featureName', { label: 'New dashboard name' }, ['beta']),
    gui.inputs.textInput('aiPrompt',    { label: 'AI prompt' },          ['experimental']),
    gui.inputs.textInput('exportPath',  { label: 'Export path' },        ['beta', 'experimental']),
    gui.inputs.textInput('legacyKey',   { label: 'Legacy key' }),
  ],
  selectors: [
    gui.selectors.tagsOr(['beta', 'experimental']).textInputs({
      override: { hint: '🧪 Preview feature — may change or vanish' },
    }),
  ],
  resources: {},
};
