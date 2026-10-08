import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

// The same page in every components-ssr-* app (see components-ssr-react/src/App.tsx).
@Component({
  standalone: true,
  selector: 'app-checkout-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <main class="page">
      <h1>GolemUI Components: Analog server rendering</h1>
      <p class="page__status" [attr.data-hydrated]="hydrated()">
        {{ hydrated() ? 'Hydrated on the client' : 'Server HTML, not yet hydrated' }}
      </p>
      <gui-alert variant="info">Yearly billing saves two months.</gui-alert>
      <form id="checkout">
        <gui-textinput
          uid="email"
          name="email"
          label="Email"
          hint="We send the receipt here."
          required
          [value]="email()"
          (gui-input)="onEmailInput($event)"
        ></gui-textinput>
        <p class="page__readout" data-readout>Email: {{ email() }}</p>
        <gui-select uid="plan" name="plan" label="Plan" [options]="plans" value="team"></gui-select>
        <gui-date-picker
          uid="start"
          name="start"
          label="Start date"
          value="2026-11-02"
        ></gui-date-picker>
        <gui-tabs active="billing">
          <gui-tab-list aria-label="Checkout">
            <gui-tab panel="billing">Billing</gui-tab>
            <gui-tab panel="company">Company</gui-tab>
          </gui-tab-list>
          <gui-tab-panel name="billing">
            <gui-checkbox
              uid="terms"
              name="terms"
              label="I accept the terms"
              [value]="true"
            ></gui-checkbox>
          </gui-tab-panel>
          <gui-tab-panel name="company">
            <gui-textinput
              uid="company"
              name="company"
              label="Company"
              value="Analytical Engines"
            ></gui-textinput>
          </gui-tab-panel>
        </gui-tabs>
        <gui-button label="Pay 49 EUR" type="submit"></gui-button>
      </form>
    </main>
  `,
})
export default class CheckoutPage {
  protected plans = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
  ];
  // Starts false so the first client render matches the server markup. afterNextRender
  // never runs on the server, so only a hydrated page sets it to true.
  protected hydrated = signal(false);
  protected email = signal('ada@example.com');

  constructor() {
    afterNextRender(() => this.hydrated.set(true));
  }

  protected onEmailInput(event: Event) {
    this.email.set((event as CustomEvent<{ value?: string }>).detail.value ?? '');
  }
}
