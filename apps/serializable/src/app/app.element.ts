import { iframeResizer, signin, tiny } from '@golemui/apps-shared';
import '@golemui/gui-lit';
import { Dependencies } from '@golemui/gui-shared';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import eventRegistration from '../forms/event-registration.form.json';
import './app.element.scss';

hljs.registerLanguage('json', json);

type Example = {
  key: string;
  label: string;
  formDef: Record<string, unknown>;
  data: Record<string, unknown>;
};

const EXAMPLES: Example[] = [
  {
    key: 'tiny',
    label: 'Tiny form',
    formDef: tiny.form as unknown as Record<string, unknown>,
    data: tiny.data,
  },
  {
    key: 'signin',
    label: 'Sign-in',
    formDef: signin.form as unknown as Record<string, unknown>,
    data: signin.data,
  },
  {
    key: 'event',
    label: 'Event registration',
    formDef: eventRegistration as unknown as Record<string, unknown>,
    data: {},
  },
];

@customElement('gui-serializable')
export class SerializableElement extends LitElement {
  @state() private declare selectedKey: string;

  private deps: Dependencies = {};

  constructor() {
    super();
    this.selectedKey = EXAMPLES[0].key;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
  }

  private onSelect(event: Event) {
    this.selectedKey = (event.target as HTMLSelectElement).value;
  }

  override render() {
    const example = EXAMPLES.find((e) => e.key === this.selectedKey) ?? EXAMPLES[0];
    const jsonText = JSON.stringify(example.formDef, null, 2);
    const highlighted = hljs.highlight(jsonText, { language: 'json' }).value;

    // Deep-clone formDef and data so the form engine's internal mutations
    // don't bleed back into the source mocks across re-renders.
    const formDef = JSON.parse(jsonText);
    const data = JSON.parse(JSON.stringify(example.data));

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
          <pre
            class="serializable-json"
          ><code class="hljs language-json">${unsafeHTML(highlighted)}</code></pre>
        </section>
        <section class="serializable-pane">
          <div class="serializable-form">
            ${keyed(
              this.selectedKey,
              html`<gui-form .formDef=${formDef} .data=${data}></gui-form>`,
            )}
          </div>
        </section>
      </div>
    `;
  }
}
