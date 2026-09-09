import { type FormSubmitEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { webmcp } from '@golemui/webmcp';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * WebMCP demo. The `webmcp` plugin registers `signup-read`, `signup-fill` and `signup-submit` on
 * `document.modelContext`, so an agent can drive the form through the widgets, with GolemUI
 * validation as the gate and the page's `formSubmit` handler as the sink.
 *
 * To try it: enable `chrome://flags/#enable-webmcp-testing`, install the "WebMCP - Model Context
 * Tool Inspector" extension and open its panel on this page. It lists the tools, runs them by hand
 * or from a natural-language prompt, and the form updates live.
 */

const config: GuiFormInitConfig = {
  formDef: [
    gui.inputs.textInput('user.name', { label: 'Full name', validator: { required: true } }),
    gui.inputs.textInput('user.email', {
      label: 'Email',
      placeholder: 'name@example.com',
      validator: { required: true, format: 'email' },
    }),
    gui.inputs.select('plan', {
      label: 'Plan',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Team', value: 'team' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      validator: { type: 'string', required: true },
    }),
    gui.inputs.numberInput('seats', {
      label: 'Seats',
      include: { when: "$form.plan === 'team' || $form.plan === 'enterprise'" },
      validator: { minimum: 1 },
    }),
    gui.inputs.checkbox('newsletter', { label: 'Send me the newsletter' }),
    // Passwords are sensitive: the agent can neither fill nor read them. Type it yourself.
    gui.inputs.password('password', {
      label: 'Password',
      validator: { required: true, minLength: 8 },
    }),
    gui.actions.button({
      label: 'Sign up',
      actionType: 'submit',
      disabled: { when: '$formIsInvalid' },
    }),
  ],
  plugins: [
    webmcp({
      name: 'signup',
      description: 'Create a new account: name, email, plan, optional seats, and a password.',
      tools: ['read', 'fill', 'submit'],
    }),
  ],
};

const hasWebmcp = 'modelContext' in document;

@customElement('lit-webmcp')
export class WebmcpElement extends LitElement {
  // The playground compiles with `useDefineForClassFields`, so a decorated class field would
  // shadow Lit's reactive accessor. Declare the reactive state the way the form factory does.
  static override properties = { submitted: { state: true } };

  declare private submitted: string[];

  constructor() {
    super();
    this.submitted = [];
  }

  override createRenderRoot() {
    return this;
  }

  private onFormSubmit(event: CustomEvent<FormSubmitEvent>) {
    this.submitted = [...this.submitted, JSON.stringify(event.detail.data, null, 2)];
  }

  override render() {
    return html`
      <style>
        lit-webmcp .webmcp-code {
          overflow: auto;
          margin: 0 0 0.75rem;
          padding: 0.75rem;
          border: 1px solid var(--gui-border-default);
          border-radius: 6px;
          background: var(--gui-bg-surface);
          color: var(--gui-text-default);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.8rem;
          line-height: 1.45;
        }
      </style>
      <div style="max-width: 40rem; color: var(--gui-text-default)">
        <h2 style="margin-top: 0">Sign up</h2>
        <p style="color: var(--gui-text-muted)">
          ${hasWebmcp
            ? html`This form is registered on <code>document.modelContext</code> as
                <code>signup-read</code>, <code>signup-fill</code> and <code>signup-submit</code>.
                Open the Model Context Tool Inspector extension to drive it.`
            : html`This browser has no WebMCP, so the plugin registered nothing. Enable
                <code>chrome://flags/#enable-webmcp-testing</code> and reload.`}
        </p>
        <gui-form .config=${config} @formSubmit=${this.onFormSubmit}></gui-form>
        ${this.submitted.length > 0
          ? html`<h3>Submitted log:</h3>
              ${this.submitted.map((entry) => html`<pre class="webmcp-code">${entry}</pre>`)}`
          : ''}
      </div>
    `;
  }
}
