import { type FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const perWidgetOverridesDemo: FormDemoDefinition = {
  title: '35. Per-Widget State Overrides',
  category: 'Ch8: States',
  description:
    'When "editing" is active (name is non-empty), the submit button label changes ' +
    'from "Create" to "Update" and the reset button becomes enabled. Type in the ' +
    'name field to see the buttons change. Clear it to see them revert.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email'),
    gui.layouts.horizontalFlex([
      gui.actions.button({
        label: 'Create',
        states: { editing: { label: 'Update' } },
      }),
      gui.actions.button({
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
