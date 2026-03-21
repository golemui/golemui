import { FormDemoDefinition } from '../../../formRegistry.domain';
import {
  _guiInputs,
  _guiCheckbox,
  _guiVerticalStack,
  _guiButton,
} from '@golemui/gui-shared';

export const visibilityWithStatesDemo: FormDemoDefinition = {
  title: '36. Visibility with States',
  category: 'Ch8: States',
  description:
    'A details section is hidden by default and appears when "showDetails" state '
    + 'becomes active (toggled by the checkbox). The visible property in state '
    + 'overrides maps to include/exclude in the pipeline.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiCheckbox('showMore', { label: 'Show contact details' }),
    _guiVerticalStack({
      children: [_guiInputs({ phone: 'string', address: 'string' })],
      states: { showDetails: { visible: true } },
    }),
    _guiButton({ label: 'Submit' }),
  ],
  formConfig: () => ({
    states: {
      showDetails: '!!$form.showMore',
    },
  }),
};
