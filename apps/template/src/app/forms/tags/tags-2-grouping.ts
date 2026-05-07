import { gui } from '@golemui/gui-shared';

const form = [
  gui.inputs.textInput('username', { label: 'Username' }, ['identity']),
  gui.inputs.textInput('referral', { label: 'Referral code' }),
];

const selectors = [
  gui.selectors.tag('identity').textInputs({
    override: {
      autocomplete: 'off',
      placeholder: 'Pick a sign-in name',
    },
  }),
];

export const tagsGroupingDemo = {
  data: {},
  form,
  selectors,
  resources: {},
};
