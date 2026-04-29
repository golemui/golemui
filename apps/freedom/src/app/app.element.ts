import { iframeResizer } from '@golemui/apps-shared';
import { DxDefinitions, DxFormConfig, gui } from '@golemui/gui-shared';
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
  formDef: DxDefinitions;
  formConfig: DxFormConfig;
  source: string;
};

const golemuiForm = [
  gui.inputs.textInput('firstName', {
    label: 'First name',
    validator: { required: true, minLength: 2 },
  }),
  gui.inputs.textInput('lastName', {
    label: 'Last name',
    validator: { required: true, minLength: 2 },
  }),
  gui.inputs.textInput('email', {
    label: 'Email',
    validator: { required: true, format: 'email' },
  }),
  gui.inputs.password('password', {
    label: 'Password',
    validator: { required: true, minLength: 8 },
  }),
  gui.actions.button({ label: 'Sign up', uid: 'submit' }),
];

const materialForm = [
  gui.inputs.custom('matTextInput', 'firstName', {
    label: 'First name',
    validator: { type: 'string', required: true, minLength: 2 },
  }),
  gui.inputs.custom('matTextInput', 'lastName', {
    label: 'Last name',
    validator: { type: 'string', required: true, minLength: 2 },
  }),
  gui.inputs.custom('matTextInput', 'email', {
    label: 'Email',
    validator: { type: 'string', required: true, format: 'email' },
  }),
  gui.inputs.custom('matTextInput', 'password', {
    label: 'Password',
    props: { type: 'password' },
    validator: { type: 'string', required: true, minLength: 8 },
  }),
  gui.actions.custom('matButton', { label: 'Sign up', uid: 'submit' }),
];

const customForm = [
  gui.inputs.custom('freedomInput', 'firstName', {
    label: 'First name',
    validator: { type: 'string', required: true, minLength: 2 },
  }),
  gui.inputs.custom('freedomInput', 'lastName', {
    label: 'Last name',
    validator: { type: 'string', required: true, minLength: 2 },
  }),
  gui.inputs.custom('freedomInput', 'email', {
    label: 'Email',
    validator: { type: 'string', required: true, format: 'email' },
  }),
  gui.inputs.custom('freedomInput', 'password', {
    label: 'Password',
    props: { type: 'password' },
    validator: { type: 'string', required: true, minLength: 8 },
  }),
  gui.actions.custom('freedomButton', { label: 'Sign up', uid: 'submit' }),
];

const GOLEMUI_SOURCE = `import { gui } from '@golemui/gui-shared';

export const signupForm = [
  gui.inputs.textInput('firstName', { validator: { required: true, minLength: 2 } }),
  gui.inputs.textInput('lastName',  { validator: { required: true, minLength: 2 } }),
  gui.inputs.textInput('email',     { validator: { required: true, format: 'email' } }),
  gui.inputs.password('password',   { validator: { required: true, minLength: 8 } }),
  gui.actions.button({ label: 'Sign up' }),
];
`;

const MATERIAL_SOURCE = `import { gui } from '@golemui/gui-shared';

export const signupForm = [
  gui.inputs.custom('matTextInput', 'firstName', { validator: { type: 'string', required: true, minLength: 2 } }),
  gui.inputs.custom('matTextInput', 'lastName',  { validator: { type: 'string', required: true, minLength: 2 } }),
  gui.inputs.custom('matTextInput', 'email',     { validator: { type: 'string', required: true, format: 'email' } }),
  gui.inputs.custom('matTextInput', 'password',  { props: { type: 'password' }, validator: { type: 'string', required: true, minLength: 8 } }),
  gui.actions.custom('matButton', { label: 'Sign up' }),
];
`;

const CUSTOM_SOURCE = `import { gui } from '@golemui/gui-shared';

export const signupForm = [
  gui.inputs.custom('myTextinput', 'firstName', { validator: { type: 'string', required: true, minLength: 2 } }),
  gui.inputs.custom('myTextinput', 'lastName',  { validator: { type: 'string', required: true, minLength: 2 } }),
  gui.inputs.custom('myTextinput', 'email',     { validator: { type: 'string', required: true, format: 'email' } }),
  gui.inputs.custom('myTextinput', 'password',  { props: { type: 'password' }, validator: { type: 'string', required: true, minLength: 8 } }),
  gui.actions.custom('myBtn', { label: 'Sign up' }),
];
`;

const LIBRARIES: Library[] = [
  {
    key: 'golemui',
    label: 'GolemUI',
    formDef: golemuiForm,
    formConfig: { widgetLoaders: {}, suppressAutomaticSubmit: true },
    source: GOLEMUI_SOURCE,
  },
  {
    key: 'material',
    label: 'Google Material',
    formDef: materialForm,
    formConfig: {
      widgetLoaders: {
        matTextInput: async () =>
          (await import('./components/mat-text-input')).FreedomMatTextInputElement,
        matButton: async () =>
          (await import('./components/mat-button')).FreedomMatButtonElement,
      },
      suppressAutomaticSubmit: true,
    },
    source: MATERIAL_SOURCE,
  },
  {
    key: 'custom',
    label: 'Your custom components',
    formDef: customForm,
    formConfig: {
      widgetLoaders: {
        freedomInput: async () =>
          (await import('./components/freedom-input')).FreedomInputElement,
        freedomButton: async () =>
          (await import('./components/freedom-button')).FreedomButtonElement,
      },
      suppressAutomaticSubmit: true,
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
                    .formConfig=${loaded.formConfig}
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
