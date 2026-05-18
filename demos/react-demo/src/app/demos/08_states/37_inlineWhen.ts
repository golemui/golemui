import { type FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

const countries = [
  { label: 'United States', value: 'US' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
];

export const inlineWhenDemo: FormDemoDefinition = {
  title: '37. Inline Conditions — include / exclude / disabled / readonly',
  category: 'Ch8: States',
  description:
    'The four conditional fields work universally across kinds. Each accepts a ' +
    "{ when: '<expr>' } inline expression; include/exclude also accept a " +
    'state-list form ({ in } / { from }). Try selecting a country, toggling ' +
    'the debug switch, and watching the subregion, the alert, the address ' +
    'block, and the buttons react.',
  formDef: () => [
    gui.layouts.horizontalFlex([
      gui.inputs.select('country', { options: countries, label: 'Country' }),
      gui.inputs.booleanInput('debug', { label: 'Debug mode' }),
    ]),

    // Inputs — include: { when } / disabled: { when } / readonly: { when }
    gui.inputs.textInput('subregion', {
      label: 'Subregion',
      include: { when: '!!$form.country' },
      disabled: { when: '$form.country === "FR"' },
    }),
    gui.inputs.textInput('notes', {
      label: 'Notes',
      readonly: { when: '!!$form.country' },
    }),

    // Inputs — exclude: { when } and exclude: { from }
    gui.inputs.textInput('debugId', {
      label: 'Debug id',
      exclude: { when: '!$form.debug' },
    }),
    gui.inputs.textInput('productionOnly', {
      label: 'Production-only id',
      exclude: { from: ['debugMode'] },
    }),

    // Layout — include: { in } applies to a state-list (mirrors the per-widget
    // states-visible:true shorthand on demo 36, in literal form)
    gui.layouts.verticalFlex([gui.inputs.textInput('debugTrace', { label: 'Trace id' })], {
      include: { in: ['debugMode'] },
      gap: 8,
    }),

    // Layout — include: { when } applies to the whole address block
    gui.layouts.verticalFlex(
      [
        gui.inputs.textInput('street', { label: 'Street' }),
        gui.inputs.textInput('city', { label: 'City' }),
      ],
      { include: { when: '!!$form.country' }, gap: 8 },
    ),

    // Display — alert with include: { when }
    gui.displays.alert({
      text: 'Debug mode is on. Field-level diagnostics are visible.',
      include: { when: '!!$form.debug' },
    }),

    // Actions — disabled: { when } and include: { when }
    gui.layouts.horizontalFlex([
      gui.actions.button({
        label: 'Save',
        onClick: 'submit',
        disabled: { when: '!$form.country' },
      }),
      gui.actions.button({
        label: 'Reset debug',
        onClick: () => null,
        include: { when: '!!$form.debug' },
      }),
    ]),
  ],
  formConfig: () => ({
    states: {
      debugMode: '!!$form.debug',
    },
  }),
};
