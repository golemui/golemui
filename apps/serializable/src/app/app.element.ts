import { iframeResizer } from '@golemui/apps-shared';
import '@golemui/gui-lit';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './app.element.scss';

hljs.registerLanguage('json', json);

type Example = { key: string; label: string; file: string };

const EXAMPLES: Example[] = [
  { key: 'tiny', label: 'Tiny form', file: 'forms/tiny.json' },
  { key: 'signin', label: 'Sign-in', file: 'forms/signin.json' },
  { key: 'event', label: 'Event registration', file: 'forms/event-registration.json' },
];

@customElement('gui-serializable')
export class SerializableElement extends LitElement {
  @state() private declare selectedKey: string;
  @state() private declare loadedKey: string | null;
  @state() private declare loading: boolean;
  @state() private declare formDef: Record<string, unknown> | null;

  constructor() {
    super();
    this.selectedKey = EXAMPLES[0].key;
    this.loadedKey = null;
    this.loading = true;
    this.formDef = null;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    this.loadExample(this.selectedKey);
  }

  private async loadExample(key: string) {
    const example = EXAMPLES.find((e) => e.key === key);
    if (!example) return;

    this.loading = true;

    const url = new URL(example.file, window.location.href).href;
    const [response] = await Promise.all([
      fetch(url, { cache: 'no-store' }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    const data = await response.json();

    if (this.selectedKey !== key) return; // a newer selection landed first
    this.formDef = data;
    this.loadedKey = key;
    this.loading = false;
  }

  private onSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedKey = value;
    this.loadExample(value);
  }

  override render() {
    const jsonText = this.formDef ? JSON.stringify(this.formDef, null, 2) : '';
    const highlighted = jsonText
      ? hljs.highlight(jsonText, { language: 'json' }).value
      : '';

    const formDef = this.formDef ? JSON.parse(jsonText) : null;
    const loadingFile = EXAMPLES.find((e) => e.key === this.selectedKey)?.file;

    return html`
      <div class="serializable-root">
        <section class="serializable-pane">
          <header class="serializable-pane-header">
            <label for="serializable-file">File</label>
            <select id="serializable-file" @change=${this.onSelect}>
              ${EXAMPLES.map(
                (e) => html`<option
                  value=${e.key}
                  ?selected=${e.key === this.selectedKey}
                >${e.label}</option>`,
              )}
            </select>
          </header>
          ${formDef
            ? html`<pre
                class="serializable-json"
              ><code class="hljs language-json">${unsafeHTML(highlighted)}</code></pre>`
            : nothing}
        </section>
        <section class="serializable-pane">
          <div class="serializable-form">
            ${formDef && this.loadedKey
              ? keyed(
                  this.loadedKey,
                  html`<gui-form .formDef=${formDef} .data=${{}}></gui-form>`,
                )
              : nothing}
          </div>
        </section>
        ${this.loading
          ? html`<div class="serializable-overlay" role="status" aria-live="polite">
              <div class="serializable-overlay-card">
                <div class="serializable-spinner" aria-hidden="true"></div>
                <span>Loading <code>${loadingFile}</code>…</span>
              </div>
            </div>`
          : nothing}
      </div>
    `;
  }
}
