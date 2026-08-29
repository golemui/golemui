import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { Dependencies } from '@golemui/gui-shared';
import type { MarkdownProps } from '@golemui/gui-shared/internals';
import { styleMap } from 'lit-html/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import './markdown-text';
import {
  LINE_VERTICAL_BOLD_PATH,
  LINK_BOLD_PATH,
  LIST_BULLETS_BOLD_PATH,
  LIST_NUMBERS_BOLD_PATH,
  QUOTES_BOLD_PATH,
  SQUARE_SPLIT_HORIZONTAL_PATH,
  TEXT_B_BOLD_PATH,
  TEXT_H_BOLD_PATH,
  TEXT_ITALIC_BOLD_PATH,
  TEXT_STRIKETHROUGH_PATH,
} from '../utils/icons';

export class GuiMarkdown extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: Array }) tools: string[] | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  @property({ type: String, attribute: 'countermode' }) counterMode:
    | 'remaining'
    | 'current'
    | undefined;
  @property({ type: Number, attribute: 'minimumheight' }) minimumHeight: number | undefined =
    undefined;
  @property({ type: Boolean, attribute: 'autogrow' }) autoGrow: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'defaultopenpreview' }) defaultOpenPreview:
    | boolean
    | undefined = undefined;
  @property({ type: Number, attribute: 'maxlength' }) maxLength: number | undefined = undefined;

  // Button titles
  @property({ type: String }) headingTitle: string | undefined = undefined;
  @property({ type: String }) boldTitle: string | undefined = undefined;
  @property({ type: String }) italicTitle: string | undefined = undefined;
  @property({ type: String }) strikethroughTitle: string | undefined = undefined;
  @property({ type: String }) quoteTitle: string | undefined = undefined;
  @property({ type: String }) linkTitle: string | undefined = undefined;
  @property({ type: String }) orderedListTitle: string | undefined = undefined;
  @property({ type: String }) unorderedListTitle: string | undefined = undefined;
  @property({ type: String }) splitViewTitle: string | undefined = undefined;
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel:
    | string
    | undefined = undefined;

  // Deps
  @property({ type: Object }) dependencies: Dependencies | undefined = undefined;

  @state() private splitViewActive = false;
  @state() private activeFormats: Record<string, boolean> = {};

  private splitViewInitialized = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`textarea[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override updated() {
    this.recalculateAutoGrow();
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    if (!this.splitViewInitialized && changedProperties.has('defaultOpenPreview')) {
      this.splitViewActive = !!this.defaultOpenPreview;
      this.splitViewInitialized = true;
    }
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<string> &
      MarkdownProps & { dependencies?: Dependencies } = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      placeholder: this.placeholder,
      counterMode: this.counterMode ?? 'remaining',
      minimumHeight: this.minimumHeight ?? 120,
      autoGrow: this.autoGrow ?? false,
      defaultOpenPreview: this.defaultOpenPreview ?? false,
      maxLength: this.maxLength,
      dependencies: this.dependencies,
    };

    // Icon
    const fieldClasses: { [key: string]: boolean } = {
      'gui-widget-input': true,
      [`gui-markdown--icon`]: false,
    };

    // Counter
    let counter = html``;

    if (templateData.counterMode && templateData.maxLength) {
      const counterClasses = {
        'gui-markdown--counter': true,
        [`gui-markdown--counter__error`]:
          (templateData.value?.length ?? 0) > templateData.maxLength,
      };
      const counterMode =
        templateData.counterMode === 'current'
          ? html`<span>${templateData.value?.length ?? 0}</span>`
          : html`<span>${templateData.maxLength - (templateData.value?.length ?? 0)}</span>`;

      counter = html`<div class=${classMap(counterClasses)}>
        ${counterMode}
        <span> / ${templateData.maxLength}</span>
      </div>`;
    }

    // AutoGrow
    const autoGrowStyles = {
      'min-height': `${templateData.minimumHeight}px`,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div
        class=${classMap({
          'gui-widget': true,
          'gui-markdown--with-preview': this.splitViewActive,
        })}
      >
        <nav
          class="gui-markdown__toolbar"
          role="toolbar"
          aria-label=${this.toolbarAriaLabel ?? 'Text formatting'}
        >
          <ul role="presentation">
            ${(this.tools ?? ['H', 'B', 'I', 'S', 'Q', 'L', '|', 'OL', 'UL']).map((tool) =>
              this.renderToolbarItem(tool),
            )}
            <li role="presentation">
              <button
                type="button"
                class=${classMap({
                  'gui-markdown__toolbar-button': true,
                  'gui-markdown__toolbar-button--active': this.splitViewActive,
                })}
                ?disabled=${this.disabled}
                aria-label=${this.splitViewTitle ?? 'Split View'}
                aria-pressed=${this.splitViewActive ? 'true' : 'false'}
                @click=${this.splitView}
                title=${this.splitViewTitle ?? 'Split View'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 256 256"
                  aria-hidden="true"
                >
                  <path d=${SQUARE_SPLIT_HORIZONTAL_PATH}></path>
                </svg>
              </button>
            </li>
          </ul>
        </nav>

        <div class="gui-markdown__container">
          <textarea
            id=${ifDefined(this.uid)}
            class=${classMap(fieldClasses)}
            style=${styleMap(autoGrowStyles)}
            ?required=${templateData.required}
            ?disabled=${templateData.disabled}
            ?readonly=${templateData.readonly}
            placeholder=${ifDefined(templateData.placeholder)}
            autocomplete=${this.autocomplete || nothing}
            .value=${live(this.value ?? '')}
            @input=${this.valueChanged}
            @keyup=${this.detectFormats}
            @mouseup=${this.detectFormats}
            @blur=${this.onBlur}
          ></textarea>

          ${this.splitViewActive
            ? html`
                <section
                  data-cy=${ifDefined(this.uid ? `${this.uid}_markdown` : nothing)}
                  class="gui-markdown__preview"
                  style=${styleMap(autoGrowStyles)}
                >
                  <gui-markdown-text
                    .md=${this.value || ''}
                    .dependencies=${this.dependencies}
                  ></gui-markdown-text>
                </section>
              `
            : nothing}
        </div>
      </div>

      <div class="gui-markdown--validation">
        <div>${addErrors(this.uid as string, templateData)}</div>
        ${counter}
      </div>
    `;
  }

  private recalculateAutoGrow() {
    if (!this.autoGrow) return;
    const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const styles = window.getComputedStyle(textarea);
    const pTop = parseFloat(styles.paddingTop);
    const pBottom = parseFloat(styles.paddingBottom);
    const totalVerticalPadding = pTop + pBottom;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(this.minimumHeight ?? 120, textarea.scrollHeight - totalVerticalPadding)}px`;
  }

  splitView() {
    if (this.disabled) return;
    this.splitViewActive = !this.splitViewActive;
  }

  private renderToolbarItem(token: string) {
    switch (token) {
      case 'H':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('heading')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.headingTitle ?? 'Heading'}
            aria-pressed=${this.activeFormats['heading'] ? 'true' : 'false'}
            @click=${this.applyFormat('# ', '', 'heading')}
            title=${this.headingTitle ?? 'Heading'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${TEXT_H_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'B':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('bold')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.boldTitle ?? 'Bold'}
            aria-pressed=${this.activeFormats['bold'] ? 'true' : 'false'}
            @click=${this.applyFormat('**', '**', 'bold')}
            title=${this.boldTitle ?? 'Bold'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${TEXT_B_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'I':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('italic')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.italicTitle ?? 'Italic'}
            aria-pressed=${this.activeFormats['italic'] ? 'true' : 'false'}
            @click=${this.applyFormat('_', '_', 'italic')}
            title=${this.italicTitle ?? 'Italic'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${TEXT_ITALIC_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'S':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('strikethrough')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.strikethroughTitle ?? 'Strikethrough'}
            aria-pressed=${this.activeFormats['strikethrough'] ? 'true' : 'false'}
            @click=${this.applyFormat('~~', '~~', 'strikethrough')}
            title=${this.strikethroughTitle ?? 'Strikethrough'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${TEXT_STRIKETHROUGH_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'Q':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('quote')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.quoteTitle ?? 'Quote'}
            aria-pressed=${this.activeFormats['quote'] ? 'true' : 'false'}
            @click=${this.applyFormat('> ', '', 'quote')}
            title=${this.quoteTitle ?? 'Quote'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${QUOTES_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'L':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('link')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.linkTitle ?? 'Link'}
            aria-pressed=${this.activeFormats['link'] ? 'true' : 'false'}
            @click=${this.applyFormat('[', '](url)', 'link')}
            title=${this.linkTitle ?? 'Link'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${LINK_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'OL':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('orderedList')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.orderedListTitle ?? 'Ordered List'}
            aria-pressed=${this.activeFormats['orderedList'] ? 'true' : 'false'}
            @click=${this.applyFormat('1. ', '', 'orderedList')}
            title=${this.orderedListTitle ?? 'Ordered List'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${LIST_NUMBERS_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case 'UL':
        return html`<li role="presentation">
          <button
            type="button"
            class=${this.toolbarBtnClass('unorderedList')}
            ?disabled=${this.disabled || this.readOnly}
            aria-label=${this.unorderedListTitle ?? 'Unordered List'}
            aria-pressed=${this.activeFormats['unorderedList'] ? 'true' : 'false'}
            @click=${this.applyFormat('- ', '', 'unorderedList')}
            title=${this.unorderedListTitle ?? 'Unordered List'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${LIST_BULLETS_BOLD_PATH}></path>
            </svg>
          </button>
        </li>`;
      case '|':
        return html`<li role="presentation">
          <span class="gui-markdown__toolbar-separator">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path d=${LINE_VERTICAL_BOLD_PATH}></path>
            </svg>
          </span>
        </li>`;
      default:
        return nothing;
    }
  }

  private toolbarBtnClass(format?: string) {
    return classMap({
      'gui-markdown__toolbar-button': true,
      'gui-markdown__toolbar-button--disabled': this.disabled === true || this.readOnly === true,
      'gui-markdown__toolbar-button--active': !!format && !!this.activeFormats[format],
    });
  }

  private detectFormats() {
    const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const { selectionStart, value } = textarea;

    // Get current line
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

    this.activeFormats = {
      heading: /^#{1,6}\s/.test(currentLine),
      bold: this.isInsideInlineFormat(value, selectionStart, '**'),
      italic: this.isInsideInlineFormat(value, selectionStart, '_'),
      strikethrough: this.isInsideInlineFormat(value, selectionStart, '~~'),
      quote: currentLine.startsWith('> '),
      link: this.isInsideLink(value, selectionStart),
      orderedList: /^\d+\.\s/.test(currentLine),
      unorderedList: currentLine.startsWith('- '),
    };
  }

  private isInsideInlineFormat(text: string, cursorPos: number, marker: string): boolean {
    const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = text.indexOf('\n', cursorPos);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const cursorInLine = cursorPos - lineStart;

    let searchFrom = 0;
    while (searchFrom < line.length) {
      const openIdx = line.indexOf(marker, searchFrom);
      if (openIdx === -1) break;

      const closeIdx = line.indexOf(marker, openIdx + marker.length);
      if (closeIdx === -1) break;

      if (cursorInLine >= openIdx && cursorInLine <= closeIdx + marker.length) {
        return true;
      }

      searchFrom = closeIdx + marker.length;
    }

    return false;
  }

  private isInsideLink(text: string, cursorPos: number): boolean {
    const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = text.indexOf('\n', cursorPos);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const cursorInLine = cursorPos - lineStart;

    const regex = /\[[^\]]*\]\([^)]*\)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (cursorInLine >= match.index && cursorInLine <= match.index + match[0].length) {
        return true;
      }
    }
    return false;
  }

  applyFormat(formatStart: string, formatEnd = '', formatKey = '') {
    return () => {
      // The buttons are natively disabled too; this guards programmatic calls
      if (this.disabled || this.readOnly) return;

      const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;
      if (!textarea) return;

      if (formatKey && this.activeFormats[formatKey]) {
        this.removeFormat(textarea, formatStart, formatEnd, formatKey);
      } else {
        const { selectionStart, selectionEnd, value } = textarea;
        const selectedText = value.substring(selectionStart, selectionEnd);
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);

        textarea.value = `${before}${formatStart}${selectedText}${formatEnd}${after}`;
        textarea.selectionStart = selectionStart + formatStart.length;
        textarea.selectionEnd = selectionStart + formatStart.length + selectedText.length;
      }

      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      this.detectFormats();
    };
  }

  private removeFormat(
    textarea: HTMLTextAreaElement,
    formatStart: string,
    formatEnd: string,
    formatKey: string,
  ) {
    const { selectionStart, value } = textarea;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

    if (!formatEnd) {
      // Line-prefix formats (heading, quote, orderedList, unorderedList)
      let prefix = formatStart;
      if (formatKey === 'heading') {
        const match = currentLine.match(/^#{1,6}\s/);
        if (match) prefix = match[0];
      } else if (formatKey === 'orderedList') {
        const match = currentLine.match(/^\d+\.\s/);
        if (match) prefix = match[0];
      }

      const before = value.substring(0, lineStart);
      const newLine = currentLine.substring(prefix.length);
      const after = value.substring(lineEnd === -1 ? value.length : lineEnd);
      textarea.value = `${before}${newLine}${after}`;
      textarea.selectionStart = Math.max(lineStart, selectionStart - prefix.length);
      textarea.selectionEnd = textarea.selectionStart;
    } else if (formatKey === 'link') {
      // Link: find [text](url) around cursor and replace with just text
      const cursorInLine = selectionStart - lineStart;
      const regex = /\[([^\]]*)\]\([^)]*\)/g;
      let match;
      while ((match = regex.exec(currentLine)) !== null) {
        if (cursorInLine >= match.index && cursorInLine <= match.index + match[0].length) {
          const linkText = match[1];
          const matchStart = lineStart + match.index;
          const matchEnd = matchStart + match[0].length;
          textarea.value = `${value.substring(0, matchStart)}${linkText}${value.substring(matchEnd)}`;
          textarea.selectionStart = matchStart;
          textarea.selectionEnd = matchStart + linkText.length;
          break;
        }
      }
    } else {
      // Inline formats (bold, italic, strikethrough)
      const cursorInLine = selectionStart - lineStart;
      let searchFrom = 0;
      while (searchFrom < currentLine.length) {
        const openIdx = currentLine.indexOf(formatStart, searchFrom);
        if (openIdx === -1) break;
        const closeIdx = currentLine.indexOf(formatEnd, openIdx + formatStart.length);
        if (closeIdx === -1) break;
        if (cursorInLine >= openIdx && cursorInLine <= closeIdx + formatEnd.length) {
          const innerText = currentLine.substring(openIdx + formatStart.length, closeIdx);
          const matchStart = lineStart + openIdx;
          const matchEnd = lineStart + closeIdx + formatEnd.length;
          textarea.value = `${value.substring(0, matchStart)}${innerText}${value.substring(matchEnd)}`;
          textarea.selectionStart = matchStart;
          textarea.selectionEnd = matchStart + innerText.length;
          break;
        }
        searchFrom = closeIdx + formatEnd.length;
      }
    }
  }

  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: target.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  onBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-markdown': GuiMarkdown;
  }
}

safeDefine('gui-markdown', GuiMarkdown);
