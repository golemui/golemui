import { FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

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
    gui.layouts.horizontalFlex([
      gui.inputs.select('country', { options: countries, label: 'Country' }),
      gui.inputs.textInput('subregion', {
        label: 'Subregion',
        when: ['!!$form.country', { visible: true }],
      }),
    ]),
    gui.inputs.textInput('notes', {
      label: 'Notes',
      when: ['!!$form.country', { readonly: true }],
    }),
    gui.actions.button({ label: 'Submit', uid: '#submit' }),
  ],
};
