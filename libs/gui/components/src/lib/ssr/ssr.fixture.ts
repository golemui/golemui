import { html } from 'lit';
import '../components/alert';
import '../components/checkbox';
import '../components/select';
import '../components/tab';
import '../components/tab-list';
import '../components/tab-panel';
import '../components/tabs';
import '../components/textinput';

/**
 * A page of elements shared by the server render and the resume specs: elements that render
 * their own content (the inputs) and elements whose children are the app's (the alert and the
 * tabs), one nested in the other.
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
    <gui-checkbox uid="terms" name="terms" label="I accept the terms" value="true"></gui-checkbox>
  </form>`;
