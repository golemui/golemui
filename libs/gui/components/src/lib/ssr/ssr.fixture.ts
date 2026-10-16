import { html } from 'lit';
import '../components/alert';
import '../components/checkbox';
import '../components/dialog';
import '../components/popover';
import '../components/select';
import '../components/tab';
import '../components/tab-list';
import '../components/tab-panel';
import '../components/tabs';
import '../components/textinput';
import '../components/tooltip';

/**
 * A page of elements shared by the server render and the resume specs: elements that render
 * their own content (the inputs) and elements whose children are the app's (the alert, the tabs,
 * the popover, the tooltip and the dialog), one nested in the other.
 *
 * Every value is an attribute: the client upgrades the elements from the HTML, so a property
 * binding such as `.options=${[...]}` would reach the server render only.
 */
export const serverTemplate = () =>
  html`<form id="checkout">
    <gui-alert variant="info">Yearly billing saves two months.</gui-alert>
    <gui-textinput
      uid="email"
      name="email"
      label="Email"
      hint="We send the receipt here."
      value="ada@example.com"
      required
    ></gui-textinput>
    <gui-tabs active="billing">
      <gui-tab-list aria-label="Checkout">
        <gui-tab panel="billing">Billing</gui-tab>
      </gui-tab-list>
      <gui-tab-panel name="billing">
        <gui-select
          uid="plan"
          name="plan"
          label="Plan"
          value="team"
          options='[{"label":"Starter","value":"starter"},{"label":"Team","value":"team"}]'
        ></gui-select>
      </gui-tab-panel>
    </gui-tabs>
    <button type="button" popovertarget="plan-help" id="plan-help-button">
      What does a plan include?
    </button>
    <gui-tooltip for="plan-help-button">Opens the plan details</gui-tooltip>
    <gui-popover placement="bottom-start">
      <div id="plan-help" popover>Every plan includes email support.</div>
    </gui-popover>
    <gui-dialog placement="end">
      <dialog id="plan-dialog" aria-labelledby="plan-dialog-title">
        <h2 id="plan-dialog-title">Compare plans</h2>
        <gui-textinput uid="coupon" name="coupon" label="Coupon"></gui-textinput>
      </dialog>
    </gui-dialog>
    <gui-checkbox uid="terms" name="terms" label="I accept the terms" value="true"></gui-checkbox>
  </form>`;
