import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { MarkdownParser } from '../types';

/**
 * Renders Markdown as HTML, with the parser the app provides.
 *
 * @cssprop --gui-md-text-color - Text color.
 * @cssprop --gui-md-line-height - Line height.
 * @cssprop --gui-md-heading-color - Heading color.
 * @cssprop --gui-md-heading-weight - Heading font weight.
 * @cssprop --gui-md-link-color - Link color.
 * @cssprop --gui-md-link-hover-color - Link color on hover.
 * @cssprop --gui-md-blockquote-bg - Quote background.
 * @cssprop --gui-md-blockquote-border-color - Quote border color.
 * @cssprop --gui-md-blockquote-color - Quote text color.
 * @cssprop --gui-md-code-bg - Code background.
 * @cssprop --gui-md-code-color - Code text color.
 * @cssprop --gui-md-code-radius - Code corner radius.
 * @cssprop --gui-md-hr-color - Horizontal rule color.
 */
export class GuiMarkdownText extends LitElement {
  /** The Markdown to render. */
  @property({ type: String }) md: string | undefined = undefined;
  /**
   * Provides the `markdown` parser that turns `md` into HTML. The element inserts that HTML
   * without sanitizing it, see `MarkdownParser`.
   */
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
