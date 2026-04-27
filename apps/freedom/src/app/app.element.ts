import { iframeResizer } from '@golemui/apps-shared';
import { defineForm } from '@golemui/core';
import '@golemui/gui-lit';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './app.element.scss';

hljs.registerLanguage('typescript', typescript);

type LibraryKey = 'golemui' | 'material' | 'custom';

type Library = {
  key: LibraryKey;
  label: string;
  formDef: ReturnType<typeof defineForm>;
  customWidgetLoaders: Record<string, () => Promise<unknown>>;
  source: string;
};

const golemuiForm = defineForm({
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      label: 'First name',
      path: 'firstName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'lastName',
      kind: 'input',
      type: 'textinput',
      label: 'Last name',
      path: 'lastName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'email',
      kind: 'input',
      type: 'textinput',
      label: 'Email',
      path: 'email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      uid: 'password',
      kind: 'input',
      type: 'password',
      label: 'Password',
      path: 'password',
      validator: { type: 'string', required: true, minLength: 8 },
    },
    {
      uid: 'submit',
      kind: 'action',
      type: 'button',
      label: 'Sign up',
    },
  ],
});

const materialForm = defineForm({
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'matTextInput',
      label: 'First name',
      path: 'firstName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'lastName',
      kind: 'input',
      type: 'matTextInput',
      label: 'Last name',
      path: 'lastName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'email',
      kind: 'input',
      type: 'matTextInput',
      label: 'Email',
      path: 'email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      uid: 'password',
      kind: 'input',
      type: 'matTextInput',
      label: 'Password',
      path: 'password',
      props: { type: 'password' },
      validator: { type: 'string', required: true, minLength: 8 },
    },
    {
      uid: 'submit',
      kind: 'action',
      type: 'matButton',
      label: 'Sign up',
    },
  ],
});

const customForm = defineForm({
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'freedomInput',
      label: 'First name',
      path: 'firstName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'lastName',
      kind: 'input',
      type: 'freedomInput',
      label: 'Last name',
      path: 'lastName',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      uid: 'email',
      kind: 'input',
      type: 'freedomInput',
      label: 'Email',
      path: 'email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      uid: 'password',
      kind: 'input',
      type: 'freedomInput',
      label: 'Password',
      path: 'password',
      props: { type: 'password' },
      validator: { type: 'string', required: true, minLength: 8 },
    },
    {
      uid: 'submit',
      kind: 'action',
      type: 'freedomButton',
      label: 'Sign up',
    },
  ],
});

const GOLEMUI_SOURCE = `import { defineForm, gui } from '@golemui/core';

export const signupForm = defineForm({
  form: [
    gui.inputs.textInput('firstName', { validator: { required: true, minLength: 2 } }),
    gui.inputs.textInput('lastName',  { validator: { required: true, minLength: 2 } }),
    gui.inputs.textInput('email',     { validator: { required: true, format: 'email' } }),
    gui.inputs.password('password',   { validator: { required: true, minLength: 8 } }),
    gui.actions.button('submit',      { label: 'Sign up' }),
  ],
});
`;

const MATERIAL_SOURCE = `import { defineForm, gui } from '@golemui/core';
import { mat } from './material-widgets';

export const signupForm = defineForm({
  form: [
    mat.textInput('firstName', { validator: { required: true, minLength: 2 } }),
    mat.textInput('lastName',  { validator: { required: true, minLength: 2 } }),
    mat.textInput('email',     { validator: { required: true, format: 'email' } }),
    mat.textInput('password',  { props: { type: 'password' }, validator: { required: true, minLength: 8 } }),
    mat.button('submit',       { label: 'Sign up' }),
  ],
});

// Material widgets are wired via customWidgetLoaders — see ./material-widgets.ts
// where each widget wraps an @material/web component (md-filled-text-field,
// md-filled-button) inside a tiny LitElement adapter.
`;

const CUSTOM_SOURCE = `import { defineForm, gui } from '@golemui/core';
import { freedom } from './my-widgets';

// Bring your own components. GolemUI doesn't care — if it implements the
// adapter contract, you can plug it in. Here we register two tiny widgets
// that render however we like.
export const signupForm = defineForm({
  form: [
    freedom.input('firstName', { validator: { required: true, minLength: 2 } }),
    freedom.input('lastName',  { validator: { required: true, minLength: 2 } }),
    freedom.input('email',     { validator: { required: true, format: 'email' } }),
    freedom.input('password',  { props: { type: 'password' }, validator: { required: true, minLength: 8 } }),
    freedom.button('submit',   { label: 'Sign up' }),
  ],
});
`;

const LIBRARIES: Library[] = [
  {
    key: 'golemui',
    label: 'GolemUI',
    formDef: golemuiForm,
    customWidgetLoaders: {},
    source: GOLEMUI_SOURCE,
  },
  {
    key: 'material',
    label: 'Google Material',
    formDef: materialForm,
    customWidgetLoaders: {
      matTextInput: async () =>
        (await import('./components/mat-text-input')).FreedomMatTextInputElement,
      matButton: async () =>
        (await import('./components/mat-button')).FreedomMatButtonElement,
    },
    source: MATERIAL_SOURCE,
  },
  {
    key: 'custom',
    label: 'Your custom components',
    formDef: customForm,
    customWidgetLoaders: {
      freedomInput: async () =>
        (await import('./components/freedom-input')).FreedomInputElement,
      freedomButton: async () =>
        (await import('./components/freedom-button')).FreedomButtonElement,
    },
    source: CUSTOM_SOURCE,
  },
];

@customElement('gui-freedom')
export class FreedomElement extends LitElement {
  @state() private declare selectedLib: LibraryKey;
  @state() private declare loadedLib: LibraryKey | null;
  @state() private declare loading: boolean;

  constructor() {
    super();
    this.selectedLib = LIBRARIES[0].key;
    this.loadedLib = null;
    this.loading = true;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    this.loadLibrary(this.selectedLib);
  }

  private async loadLibrary(key: LibraryKey) {
    this.loading = true;
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (this.selectedLib !== key) return; // a newer selection landed first
    this.loadedLib = key;
    this.loading = false;
  }

  private onSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value as LibraryKey;
    this.selectedLib = value;
    this.loadLibrary(value);
  }

  override render() {
    const loaded = this.loadedLib
      ? LIBRARIES.find((l) => l.key === this.loadedLib)
      : null;
    const highlighted = loaded
      ? hljs.highlight(loaded.source, { language: 'typescript' }).value
      : '';
    const loadingLabel = LIBRARIES.find((l) => l.key === this.selectedLib)?.label;
    const customClass = this.loadedLib === 'custom' ? ' freedom-form--custom' : '';

    return html`
      <div class="freedom-root">
        <section class="freedom-pane">
          <header class="freedom-pane-header">
            <label for="freedom-library">UI Library</label>
            <select id="freedom-library" @change=${this.onSelect}>
              ${LIBRARIES.map(
                (l) => html`<option
                  value=${l.key}
                  ?selected=${l.key === this.selectedLib}
                >${l.label}</option>`,
              )}
            </select>
          </header>
          ${loaded
            ? html`<pre
                class="freedom-source"
              ><code class="hljs language-typescript">${unsafeHTML(highlighted)}</code></pre>`
            : nothing}
        </section>
        <section class="freedom-pane">
          <div class="freedom-form${customClass}">
            ${loaded
              ? keyed(
                  loaded.key,
                  html`<gui-form
                    .formDef=${loaded.formDef}
                    .data=${{}}
                    .customWidgetLoaders=${loaded.customWidgetLoaders}
                  ></gui-form>`,
                )
              : nothing}
          </div>
        </section>
        ${this.loading
          ? html`<div class="freedom-overlay" role="status" aria-live="polite">
              <div class="freedom-overlay-card">
                <div class="freedom-spinner" aria-hidden="true"></div>
                <span>Loading <code>${loadingLabel}</code> widgets…</span>
              </div>
            </div>`
          : nothing}
      </div>
    `;
  }
}
