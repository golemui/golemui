import { type FormSubmitEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { type ModelContextLike, type ModelContextTool, webmcp } from '@golemui/webmcp';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

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
  /** Chrome's build takes the arguments as a JSON string and answers with a JSON string. */
  executeTool?(tool: RegisteredTool, input: string): Promise<string>;
};

/** Chrome answers with a JSON string; a build that already returns a value is passed through. */
function parseToolResult(result: unknown): unknown {
  if (typeof result !== 'string') {
    return result;
  }
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

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
            ? parseToolResult(await native.executeTool(tool, JSON.stringify(input)))
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
  gui.inputs.password('password', {
    label: 'Password',
    validator: { required: true, minLength: 8 },
  }),
  gui.actions.button({
    label: 'Sign up',
    actionType: 'submit',
    disabled: { when: '$formIsInvalid' },
  }),
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
  // The playground compiles with `useDefineForClassFields`, so decorated class fields would
  // shadow Lit's reactive accessors. Declare the reactive state the way the form factory does.
  static override properties = {
    tools: { state: true },
    input: { state: true },
    output: { state: true },
    submitted: { state: true },
  };

  declare private tools: RegisteredTool[];
  declare private input: string;
  declare private output: string;
  declare private submitted: string[];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    super();
    this.tools = [];
    this.input = SAMPLE_INPUT;
    this.output = '';
    this.submitted = [];
  }

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
    try {
      const result = await modelContext.run(tool, input);
      this.output = JSON.stringify(result, null, 2);
    } catch (err) {
      this.output = `The model context rejected the call: ${(err as Error).message}`;
    }
  }

  private onFormSubmit(event: CustomEvent<FormSubmitEvent>) {
    this.submitted = [...this.submitted, JSON.stringify(event.detail.data)];
  }

  override render() {
    return html`
      <style>
        lit-webmcp {
          color: var(--gui-text-default);
        }
        lit-webmcp .webmcp-code {
          display: block;
          box-sizing: border-box;
          overflow: auto;
          margin: 0;
          padding: 0.75rem;
          border: 1px solid var(--gui-border-default);
          border-radius: 6px;
          background: var(--gui-bg-surface);
          color: var(--gui-text-default);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.8rem;
          line-height: 1.45;
          white-space: pre;
        }
        lit-webmcp textarea.webmcp-code {
          white-space: pre-wrap;
        }
        lit-webmcp details summary {
          cursor: pointer;
        }
      </style>
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
          <p style="color: var(--gui-text-muted)">
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
                      <button
                        type="button"
                        style="margin-left: 0.5rem"
                        @click=${() => this.run(tool)}
                      >
                        Run
                      </button>
                    </summary>
                    <p>${tool.description}</p>
                    <pre class="webmcp-code" style="max-height: 20rem">
${JSON.stringify(tool.inputSchema, null, 2)}</pre
                    >
                  </details>
                `,
              )}
          <h3>Tool input (JSON)</h3>
          <textarea
            class="webmcp-code"
            rows="8"
            style="width: 100%; resize: vertical"
            .value=${this.input}
            @input=${(event: Event) => (this.input = (event.target as HTMLTextAreaElement).value)}
          ></textarea>
          <h3>Result</h3>
          <pre class="webmcp-code" style="max-height: 24rem">
${this.output || 'Run a tool to see its result.'}</pre
          >
        </section>
      </div>
    `;
  }
}
