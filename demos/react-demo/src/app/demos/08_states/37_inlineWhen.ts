import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiSelect,
  _guiTextInput,
  _guiHorizontalStack,
  _guiButton,
} from '@golemui/gui-shared';

const countries = [
  { label: 'United States', value: 'US' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
];

export const inlineWhenDemo: FormDemoDefinition = {
  title: '37. Inline Conditions with when',
  category: 'Ch8: States',
  description:
    'The subregion field appears only when a country is selected, using an inline '
    + '"when" condition instead of a named state. The notes field becomes readonly '
    + 'when a country is selected. Unlike named states, "when" is a shorthand for '
    + 'simple conditional overrides that don\'t need a reusable name.',
  formDef: () => [
    _guiHorizontalStack([
      _guiSelect('country', { options: countries, label: 'Country' }),
      _guiTextInput('subregion', {
        label: 'Subregion',
        when: ['!!$form.country', { visible: true }],
      }),
    ]),
    _guiTextInput('notes', {
      label: 'Notes',
      when: ['!!$form.country', { readonly: true }],
    }),
    _guiButton({ label: 'Submit', uid: '#submit' }),
  ],
};
