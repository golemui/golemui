import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { MarkdownParser } from '../types';

export class GuiMarkdownText extends LitElement {
  @property({ type: String }) md: string | undefined = undefined;
  @property({ type: Object }) dependencies: { markdown?: MarkdownParser } | undefined = undefined;

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

safeDefine('gui-markdown-text', GuiMarkdownText);
