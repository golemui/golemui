import { gui, type DxDefinitionItem, type GuiFormInitConfig } from '@golemui/gui-shared';

// The same form as the Vue, React and Lit harnesses, so the SSR harnesses stay directly
// comparable. No tabs, no markdown, and no calendar, so the render does not depend on the
// server clock.
const formDef: DxDefinitionItem[] = [
  gui.layouts.flex(
    [
      gui.inputs.textInput('firstName', {
        label: 'First name',
        placeholder: 'Ada',
        validator: { required: true, minLength: 2 },
      }),
      gui.inputs.textInput('lastName', {
        label: 'Last name',
        placeholder: 'Lovelace',
        validator: { required: true, minLength: 2 },
      }),
    ],
    { direction: 'row', gap: 16 },
  ),
  gui.inputs.numberInput('seats', {
    label: 'Seats',
    validator: { required: true, minimum: 1 },
  }),
  gui.inputs.select('plan', {
    label: 'Plan',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
    validator: { type: 'string', required: true },
  }),
  gui.inputs.checkbox('acceptTerms', {
    label: 'I accept the terms',
    validator: { required: true },
  }),
  gui.actions.button({
    label: 'Create account',
    actionType: 'submit',
  }),
];

// Server rendering requires an explicit formName: it is what makes the server and the
// client produce the same form id.
export const config: GuiFormInitConfig = {
  formName: 'harness-form',
  formDef,
  data: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    seats: 3,
    plan: 'pro',
    acceptTerms: false,
  },
};
