import { FormDemoDefinition } from '../../../formRegistry.domain';
import { _guiInputs, _guiButton, _guiHorizontalStack } from '@golemui/gui-shared';

export const perWidgetOverridesDemo: FormDemoDefinition = {
  title: '35. Per-Widget State Overrides',
  category: 'Ch8: States',
  description:
    'When "editing" is active (name is non-empty), the submit button label changes '
    + 'from "Create" to "Update" and the reset button becomes enabled. Type in the '
    + 'name field to see the buttons change. Clear it to see them revert.',
  formDef: () => [
    _guiInputs({ name: 'string', email: 'string' }),
    _guiHorizontalStack([
      _guiButton({
        label: 'Create',
        states: { editing: { label: 'Update' } },
      }),
      _guiButton({
        label: 'Reset',
        disabled: true,
        states: { editing: { disabled: false } },
      }),
    ]),
  ],
  formConfig: () => ({
    states: {
      editing: '!!$form.name',
    },
  }),
};
