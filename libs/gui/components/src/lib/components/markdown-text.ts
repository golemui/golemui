import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { type Dependencies } from '@golemui/gui-shared';

@customElement('gui-markdown-text')
export class GuiMarkdownText extends LitElement {
  @property({ type: String }) md: string | undefined = undefined;
  @property({ type: Object }) dependencies: Dependencies | undefined = undefined;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`${unsafeHTML(this.dependencies?.markdown?.parse(this.md ?? ''))}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-markdown-text': GuiMarkdownText;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-markdown-text')) {
  customElements.define('gui-markdown-text', GuiMarkdownText);
}
