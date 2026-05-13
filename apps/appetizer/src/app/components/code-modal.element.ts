import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './code-modal.element.scss';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);

export type CodeModalMode = 'submit' | 'source';

const TITLES: Record<CodeModalMode, string> = {
  submit: 'Submitted data',
  source: 'Form source',
};

@customElement('gui-code-modal')
export class CodeModalElement extends LitElement {
  @property({ type: Boolean }) declare open: boolean;
  @property({ attribute: false }) declare mode: CodeModalMode;
  @property({ attribute: false }) declare data: unknown;
  @property({ attribute: false }) declare source: string;

  constructor() {
    super();
    this.open = false;
    this.mode = 'submit';
    this.data = null;
    this.source = '';
  }

  private onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && this.open) {
      ev.stopPropagation();
      this.close();
    }
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private onBackdropClick(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) {
      this.close();
    }
  }

  override render() {
    if (!this.open) return nothing;
    const title = TITLES[this.mode];
    const language = this.mode === 'submit' ? 'json' : 'typescript';
    const raw = this.mode === 'submit' ? JSON.stringify(this.data ?? {}, replacer, 2) : this.source;
    const highlighted = hljs.highlight(raw, { language }).value;
    return html`
      <div class="code-modal-backdrop" @click=${this.onBackdropClick} role="presentation">
        <div
          class="code-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label=${title}
          tabindex="-1"
        >
          <header class="code-modal-header">
            <h3 class="code-modal-title">${title}</h3>
            <button
              type="button"
              class="code-modal-close"
              aria-label="Close"
              @click=${() => this.close()}
            >
              ×
            </button>
          </header>
          <pre class="code-modal-body"><code class="hljs language-${language}">${unsafeHTML(
            highlighted,
          )}</code></pre>
        </div>
      </div>
    `;
  }
}

function replacer(_key: string, value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return value;
}
