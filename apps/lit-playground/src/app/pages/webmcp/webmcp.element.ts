import { type FormSubmitEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { type ModelContextLike, type ModelContextTool, webmcp } from '@golemui/webmcp';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * WebMCP demo: the form below registers `signup-fill`, `signup-submit` and `signup-read` on the
 * browser's model context. With Chrome's `chrome://flags/#enable-webmcp-testing` flag the real
 * `document.modelContext` is used and an agent (or the Model Context Tool Inspector extension)
 * can drive the form. Everywhere else a small in-page fake stands in, so the inspector panel
 * works in any browser.
 */

type RegisteredTool = ModelContextTool & { execute: ModelContextTool['execute'] };

type InspectableContext = ModelContextLike & {
  listTools(): Promise<RegisteredTool[]>;
  run(tool: RegisteredTool, input: unknown): Promise<unknown>;
};

function createInPageModelContext(): InspectableContext {
  const tools = new Map<string, RegisteredTool>();
  return {
    async registerTool(tool, options) {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) {
          tools.delete(tool.name);
        }
      });
    },
    listTools: async () => [...tools.values()],
    run: (tool, input) => tool.execute(input, { signal: new AbortController().signal }),
  };
}

type NativeModelContext = ModelContextLike & {
  getTools?(): Promise<RegisteredTool[]>;
  executeTool?(tool: RegisteredTool, input: unknown): Promise<string>;
};

function resolveInspectableContext(): { context: InspectableContext; native: boolean } {
  const native = (document as unknown as { modelContext?: NativeModelContext }).modelContext;
  if (native && typeof native.registerTool === 'function') {
    return {
      native: true,
      context: {
        registerTool: (tool, options) => native.registerTool(tool, options),
        listTools: async () => (await native.getTools?.()) ?? [],
        run: async (tool, input) =>
          native.executeTool
            ? JSON.parse(await native.executeTool(tool, input))
            : tool.execute(input, { signal: new AbortController().signal }),
      },
    };
  }
  return { native: false, context: createInPageModelContext() };
}

const { context: modelContext, native } = resolveInspectableContext();

const formDef = [
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
  gui.inputs.password('password', { label: 'Password', validator: { required: true, minLength: 8 } }),
  gui.actions.button({ label: 'Sign up', actionType: 'submit', disabled: { when: '$formIsInvalid' } }),
];

const config: GuiFormInitConfig = {
  formDef,
  plugins: [
    webmcp({
      name: 'signup',
      description: 'Create a new account: name, email, plan, optional seats, and a password.',
      tools: ['read', 'fill', 'submit'],
      modelContext,
    }),
  ],
};

const SAMPLE_INPUT = JSON.stringify(
  { user: { name: 'Ada Lovelace', email: 'ada@example.com' }, plan: 'Team', seats: 3 },
  null,
  2,
);

@customElement('lit-webmcp')
export class WebmcpElement extends LitElement {
  @state() private tools: RegisteredTool[] = [];
  @state() private input = SAMPLE_INPUT;
  @state() private output = '';
  @state() private submitted: string[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    void this.refreshTools();
    // Registration is debounced by the plugin; poll the context until the tools show up.
    this.refreshTimer = setInterval(() => void this.refreshTools(), 500);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.refreshTimer);
  }

  private async refreshTools() {
    const tools = await modelContext.listTools();
    if (tools.map((t) => t.name).join() !== this.tools.map((t) => t.name).join()) {
      this.tools = tools;
    }
  }

  private async run(tool: RegisteredTool) {
    let input: unknown = {};
    try {
      input = this.input.trim() === '' ? {} : JSON.parse(this.input);
    } catch (err) {
      this.output = `Input is not valid JSON: ${(err as Error).message}`;
      return;
    }
    const result = await modelContext.run(tool, input);
    this.output = JSON.stringify(result, null, 2);
  }

  private onFormSubmit(event: CustomEvent<FormSubmitEvent>) {
    this.submitted = [...this.submitted, JSON.stringify(event.detail.data)];
  }

  override render() {
    return html`
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2rem">
        <section>
          <h2 style="margin-top: 0">Sign up</h2>
          <gui-form .config=${config} @formSubmit=${this.onFormSubmit}></gui-form>
          ${this.submitted.length > 0
            ? html`<h3>Host received submits</h3>
                <ol>
                  ${this.submitted.map((entry) => html`<li><code>${entry}</code></li>`)}
                </ol>`
            : ''}
        </section>
        <section>
          <h2 style="margin-top: 0">Model context inspector</h2>
          <p style="color: #6b7280">
            ${native
              ? html`Using the browser's <code>document.modelContext</code>.`
              : html`This browser has no WebMCP; an in-page stand-in records the registrations.
                  Enable <code>chrome://flags/#enable-webmcp-testing</code> to use the real API.`}
          </p>
          <h3>Registered tools</h3>
          ${this.tools.length === 0
            ? html`<p><em>No tools yet.</em></p>`
            : this.tools.map(
                (tool) => html`
                  <details style="margin-bottom: 0.75rem">
                    <summary>
                      <strong>${tool.name}</strong>
                      <button type="button" style="margin-left: 0.5rem" @click=${() => this.run(tool)}>
                        Run
                      </button>
                    </summary>
                    <p>${tool.description}</p>
                    <pre style="overflow: auto; max-height: 20rem; font-size: 0.8rem">${JSON.stringify(
                      tool.inputSchema,
                      null,
                      2,
                    )}</pre>
                  </details>
                `,
              )}
          <h3>Tool input (JSON)</h3>
          <textarea
            rows="8"
            style="width: 100%; font-family: monospace"
            .value=${this.input}
            @input=${(event: Event) => (this.input = (event.target as HTMLTextAreaElement).value)}
          ></textarea>
          <h3>Result</h3>
          <pre style="overflow: auto; max-height: 24rem; font-size: 0.8rem">${this.output ||
          'Run a tool to see its result.'}</pre>
        </section>
      </div>
    `;
  }
}
