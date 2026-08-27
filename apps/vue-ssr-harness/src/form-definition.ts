import { gui } from '@golemui/gui-shared';
import type { DxDefinitionItem } from '@golemui/gui-shared';

/**
 * A small form that is fully visible without JavaScript.
 *
 * No tabs, no markdown, and no calendar, so the server markup is complete and does not
 * depend on the server clock.
 */
export const formDef: DxDefinitionItem[] = [
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
    validator: { required: true, type: 'number', minimum: 1 },
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

export const formData = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  seats: 3,
  plan: 'pro',
  acceptTerms: false,
};
