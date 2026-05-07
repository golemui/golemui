import { gui } from '@golemui/gui-shared';

const form = [
  gui.inputs.textInput('user.email', { label: 'Email' }, ['pii']),
  gui.inputs.textInput('user.phone', { label: 'Phone' }, ['pii']),
  gui.inputs.textInput('user.nickname', { label: 'Display name' }),
];

const selectors = [
  gui.selectors
    .tag('pii')
    .inputs({ override: { hint: 'Personal data — never shared.' } }),
];

export const tagsHintDemo = {
  data: {},
  form,
  selectors,
  resources: {},
};
