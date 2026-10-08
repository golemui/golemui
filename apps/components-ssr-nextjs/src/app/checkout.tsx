'use client';

import {
  GuiAlert,
  GuiButton,
  GuiCheckbox,
  GuiDatePicker,
  GuiSelect,
  GuiTab,
  GuiTabList,
  GuiTabPanel,
  GuiTabs,
  GuiTextinput,
} from '@golemui/gui-components/react';
import { useEffect, useState } from 'react';

// The same page in every components-ssr-* app, so their results compare directly: elements that
// render their own content (the fields), elements that wrap the app's children (the alert and the
// tabs), a composite element (the date picker) and a field nested in a wrapper (the tab panel).
const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Team', value: 'team' },
];

export function Checkout() {
  // Starts false so the first client render matches the server markup. The effect runs
  // after hydration only.
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState('ada@example.com');
  useEffect(() => setHydrated(true), []);

  return (
    <main className="page">
      <h1>GolemUI Components: Next.js server rendering</h1>
      <p className="page__status" data-hydrated={hydrated}>
        {hydrated ? 'Hydrated on the client' : 'Server HTML, not yet hydrated'}
      </p>
      <GuiAlert variant="info">Yearly billing saves two months.</GuiAlert>
      <form id="checkout">
        <GuiTextinput
          uid="email"
          name="email"
          label="Email"
          hint="We send the receipt here."
          required
          value={email}
          onGuiInput={(event) => setEmail(event.detail.value ?? '')}
        />
        <p className="page__readout" data-readout>
          Email: {email}
        </p>
        <GuiSelect uid="plan" name="plan" label="Plan" options={plans} value="team" />
        <GuiDatePicker uid="start" name="start" label="Start date" value="2026-11-02" />
        <GuiTabs active="billing">
          <GuiTabList aria-label="Checkout">
            <GuiTab panel="billing">Billing</GuiTab>
            <GuiTab panel="company">Company</GuiTab>
          </GuiTabList>
          <GuiTabPanel name="billing">
            <GuiCheckbox uid="terms" name="terms" label="I accept the terms" value={true} />
          </GuiTabPanel>
          <GuiTabPanel name="company">
            <GuiTextinput uid="company" name="company" label="Company" value="Analytical Engines" />
          </GuiTabPanel>
        </GuiTabs>
        <GuiButton label="Pay 49 EUR" type="submit" />
      </form>
    </main>
  );
}
