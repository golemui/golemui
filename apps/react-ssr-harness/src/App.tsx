import type { FormSubmitEvent } from '@golemui/core';
import { gui, type DxDefinitionItem, type GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-react';
import { useEffect, useState } from 'react';

// The same form as the Vue harness, so the two SSR harnesses stay directly comparable.
// No tabs, no markdown, and no calendar, so the render does not depend on the server
// clock. The widget internals are not server rendered, so each field only becomes usable
// once Lit upgrades its custom element.
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

// An explicit formName keeps the form id identical on the server and the client.
const config: GuiFormInitConfig = {
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

const onFormSubmit = (event: FormSubmitEvent) => {
  console.log('form submitted', event.data);
};

export function App() {
  // Starts false so the first client render matches the server markup. The effect runs
  // after hydration, so the status text changes only after hydration has finished.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="harness">
      <h1 className="harness__title">React server rendering harness</h1>
      <p className="harness__status" data-hydrated={hydrated}>
        {hydrated ? 'Hydrated on the client' : 'Server HTML, not yet hydrated'}
      </p>
      <p className="harness__note">
        The React layer is server rendered. The widget internals are not, so every gui-* element
        arrives empty and Lit fills it in when the browser upgrades it. View source to see it.
      </p>
      <GuiForm config={config} formSubmit={onFormSubmit} />
    </div>
  );
}
