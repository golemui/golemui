import { FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const visibilityWithStatesDemo: FormDemoDefinition = {
  title: '36. Visibility with States',
  category: 'Ch8: States',
  description:
    'A details section is hidden by default and appears when "showDetails" state ' +
    'becomes active (toggled by the checkbox). The visible property in state ' +
    'overrides maps to include/exclude in the pipeline.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.checkbox('showMore', { label: 'Show contact details' }),
    gui.layouts.verticalFlex([gui.inputs.textInput('phone'), gui.inputs.textInput('address')], {
      states: { showDetails: { visible: true } },
    }),
    gui.actions.button({ label: 'Submit' }),
  ],
  formConfig: () => ({
    states: {
      showDetails: '!!$form.showMore',
    },
  }),
};
