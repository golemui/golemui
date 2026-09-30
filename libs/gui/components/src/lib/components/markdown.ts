import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { MarkdownParser } from '../types';
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
import { GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { message } from '../utils/messages';

/** The formats that apply to whole lines, with the prefix that marks a line as formatted. */
const LINE_FORMATS = {
  heading: /^#{1,6}\s/,
  quote: /^> /,
  orderedList: /^\d+\.\s/,
  unorderedList: /^- /,
};

type LineFormat = keyof typeof LINE_FORMATS;

const isLineFormat = (format: string): format is LineFormat =>
  Object.prototype.hasOwnProperty.call(LINE_FORMATS, format);

/** What <gui-markdown> renders besides the control state: its presentation props. */
export type GuiMarkdownProps = {
  hint?: string;
  placeholder?: string;
  counterMode?: 'remaining' | 'current';
  minimumHeight?: number;
  autoGrow?: boolean;
  defaultOpenPreview?: boolean;
  maxLength?: number;
  dependencies?: { markdown?: MarkdownParser };
};

/**
 * A Markdown editor with a formatting toolbar and an optional preview.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the text, on blur or with a toolbar command.
 *   `detail.value` is the Markdown.
 * @fires gui-blur - Focus left the control.
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
export class GuiMarkdown extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The Markdown text. */
  @property({ type: String }) value: string | undefined = undefined;

  /**
   * Toolbar buttons, in order: `H` heading, `B` bold, `I` italic, `S` strikethrough, `Q` quote, `L`
   * link, `OL` and `UL` lists, and `|` for a separator. All by default.
   */
  @property({ type: Array }) tools: string[] | undefined = undefined;
  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner native control. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /**
   * With `maxLength`, whether the counter shows the characters left (`remaining`) or used
   * (`current`).
   */
  @property({ type: String, attribute: 'counter-mode' }) counterMode:
    | 'remaining'
    | 'current'
    | undefined;
  /** Minimum height of the field, in pixels. */
  @property({ type: Number, attribute: 'minimum-height' }) minimumHeight: number | undefined =
    undefined;
  /** Grows the field with its content instead of scrolling. */
  @property({ type: Boolean, attribute: 'auto-grow' }) autoGrow: boolean | undefined = false;
  /** Opens with the preview shown. */
  @property({ type: Boolean, attribute: 'default-open-preview' }) defaultOpenPreview:
    | boolean
    | undefined = undefined;
  /**
   * The number of characters the counter counts against. It only drives the counter: longer text
   * is not blocked, and the counter marks it as over the limit.
   */
  @property({ type: Number, attribute: 'maxlength' }) maxLength: number | undefined = undefined;

  // Button titles
  /** Tooltip and accessible name of the heading button. */
  @property({ type: String, attribute: 'heading-title' }) headingTitle: string | undefined =
    undefined;
  /** Tooltip and accessible name of the bold button. */
  @property({ type: String, attribute: 'bold-title' }) boldTitle: string | undefined = undefined;
  /** Tooltip and accessible name of the italic button. */
  @property({ type: String, attribute: 'italic-title' }) italicTitle: string | undefined =
    undefined;
  /** Tooltip and accessible name of the strikethrough button. */
  @property({ type: String, attribute: 'strikethrough-title' }) strikethroughTitle:
    | string
    | undefined = undefined;
  /** Tooltip and accessible name of the quote button. */
  @property({ type: String, attribute: 'quote-title' }) quoteTitle: string | undefined = undefined;
  /** Tooltip and accessible name of the link button. */
  @property({ type: String, attribute: 'link-title' }) linkTitle: string | undefined = undefined;
  /** Tooltip and accessible name of the numbered list button. */
  @property({ type: String, attribute: 'ordered-list-title' }) orderedListTitle:
    | string
    | undefined = undefined;
  /** Tooltip and accessible name of the bulleted list button. */
  @property({ type: String, attribute: 'unordered-list-title' }) unorderedListTitle:
    | string
    | undefined = undefined;
  /** Tooltip and accessible name of the preview button. */
  @property({ type: String, attribute: 'split-view-title' }) splitViewTitle: string | undefined =
    undefined;
  /** Accessible name of the toolbar. */
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel:
    | string
    | undefined = undefined;

  // Deps
  /** Provides the `markdown` parser used by the preview. */
  @property({ type: Object }) dependencies: { markdown?: MarkdownParser } | undefined = undefined;

  @state() private splitViewActive = false;
  @state() private activeFormats: Record<string, boolean> = {};

  private splitViewInitialized = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`textarea[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid,
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

    const templateData: ControlTemplateData<string> & GuiMarkdownProps = {
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
      ${addLabel(this.uid, templateData)}

      <div
        class=${classMap({
          'gui-widget': true,
          'gui-markdown--with-preview': this.splitViewActive,
        })}
      >
        <div
          class="gui-markdown__toolbar"
          role="toolbar"
          aria-label=${message('textFormatting', this.toolbarAriaLabel)}
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
                aria-label=${message('splitView', this.splitViewTitle)}
                aria-pressed=${this.splitViewActive ? 'true' : 'false'}
                @click=${this.splitView}
                title=${message('splitView', this.splitViewTitle)}
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
        </div>

        <div class="gui-markdown__container">
          <textarea
            id=${this.uid}
            class=${classMap(fieldClasses)}
            style=${cspStyleMap(autoGrowStyles)}
            ?required=${templateData.required}
            ?disabled=${templateData.disabled}
            ?readonly=${templateData.readonly}
            placeholder=${ifDefined(templateData.placeholder)}
            autocomplete=${this.autocomplete || nothing}
            .value=${live(this.value ?? '')}
            @input=${this.valueChanged}
            @change=${this.valueCommitted}
            @keyup=${this.detectFormats}
            @mouseup=${this.detectFormats}
            @blur=${this.onBlur}
          ></textarea>

          ${this.splitViewActive
            ? html`
                <section
                  data-cy=${`${this.uid}_markdown`}
                  class="gui-markdown__preview"
                  style=${cspStyleMap(autoGrowStyles)}
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
        <div>${addErrors(this.uid, templateData)}</div>
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

  /** @internal */
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
            aria-label=${message('heading', this.headingTitle)}
            aria-pressed=${this.activeFormats['heading'] ? 'true' : 'false'}
            @click=${this.applyFormat('# ', '', 'heading')}
            title=${message('heading', this.headingTitle)}
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
            aria-label=${message('bold', this.boldTitle)}
            aria-pressed=${this.activeFormats['bold'] ? 'true' : 'false'}
            @click=${this.applyFormat('**', '**', 'bold')}
            title=${message('bold', this.boldTitle)}
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
            aria-label=${message('italic', this.italicTitle)}
            aria-pressed=${this.activeFormats['italic'] ? 'true' : 'false'}
            @click=${this.applyFormat('_', '_', 'italic')}
            title=${message('italic', this.italicTitle)}
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
            aria-label=${message('strikethrough', this.strikethroughTitle)}
            aria-pressed=${this.activeFormats['strikethrough'] ? 'true' : 'false'}
            @click=${this.applyFormat('~~', '~~', 'strikethrough')}
            title=${message('strikethrough', this.strikethroughTitle)}
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
            aria-label=${message('quote', this.quoteTitle)}
            aria-pressed=${this.activeFormats['quote'] ? 'true' : 'false'}
            @click=${this.applyFormat('> ', '', 'quote')}
            title=${message('quote', this.quoteTitle)}
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
            aria-label=${message('link', this.linkTitle)}
            aria-pressed=${this.activeFormats['link'] ? 'true' : 'false'}
            @click=${this.applyFormat('[', '](url)', 'link')}
            title=${message('link', this.linkTitle)}
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
            aria-label=${message('orderedList', this.orderedListTitle)}
            aria-pressed=${this.activeFormats['orderedList'] ? 'true' : 'false'}
            @click=${this.applyFormat('1. ', '', 'orderedList')}
            title=${message('orderedList', this.orderedListTitle)}
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
            aria-label=${message('unorderedList', this.unorderedListTitle)}
            aria-pressed=${this.activeFormats['unorderedList'] ? 'true' : 'false'}
            @click=${this.applyFormat('- ', '', 'unorderedList')}
            title=${message('unorderedList', this.unorderedListTitle)}
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
      heading: LINE_FORMATS.heading.test(currentLine),
      bold: this.isInsideInlineFormat(value, selectionStart, '**'),
      italic: this.isInsideInlineFormat(value, selectionStart, '_'),
      strikethrough: this.isInsideInlineFormat(value, selectionStart, '~~'),
      quote: LINE_FORMATS.quote.test(currentLine),
      link: this.isInsideLink(value, selectionStart),
      orderedList: LINE_FORMATS.orderedList.test(currentLine),
      unorderedList: LINE_FORMATS.unorderedList.test(currentLine),
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

  /** @internal */
  applyFormat(formatStart: string, formatEnd = '', formatKey = '') {
    return () => {
      // The buttons are natively disabled too; this guards programmatic calls
      if (this.disabled || this.readOnly) return;

      const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;
      if (!textarea) return;

      if (isLineFormat(formatKey)) {
        this.toggleLineFormat(textarea, formatStart, formatKey);
      } else if (formatKey && this.activeFormats[formatKey]) {
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
      // A toolbar command is a complete edit, and a programmatic value change fires no native
      // `change` to commit it later.
      dispatchChange(this, textarea.value);
      this.detectFormats();
    };
  }

  /**
   * Adds a line format (heading, quote, list) at the start of the caret's line, or of every
   * selected line, or removes it from them when the caret's line already has it.
   */
  private toggleLineFormat(textarea: HTMLTextAreaElement, prefix: string, formatKey: LineFormat) {
    const { selectionStart, selectionEnd, value } = textarea;
    const pattern = LINE_FORMATS[formatKey];
    const remove = !!this.activeFormats[formatKey];

    const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    // A selection that ends right after a line break leaves the next line alone.
    const end =
      selectionEnd > selectionStart && value[selectionEnd - 1] === '\n'
        ? selectionEnd - 1
        : selectionEnd;
    const lineEnd = value.indexOf('\n', end);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;

    const block = value
      .substring(blockStart, blockEnd)
      .split('\n')
      .map((line, index) => {
        if (remove) return line.replace(pattern, '');
        if (pattern.test(line)) return line;
        return `${formatKey === 'orderedList' ? `${index + 1}. ` : prefix}${line}`;
      })
      .join('\n');
    textarea.value = `${value.substring(0, blockStart)}${block}${value.substring(blockEnd)}`;

    if (selectionStart === selectionEnd) {
      // The caret stays on its character, or at the line start when its prefix is removed.
      const caret = Math.max(blockStart, selectionStart + block.length - (blockEnd - blockStart));
      textarea.setSelectionRange(caret, caret);
    } else {
      textarea.setSelectionRange(blockStart, blockStart + block.length);
    }
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

    if (formatKey === 'link') {
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

  /** @internal */
  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.value = target.value;
      dispatchValue(this, this.value, { commit: false });
    }
  }

  /**
   * The native `change`: the user committed the edit, on blur (Enter adds a new line).
   *
   * @internal
   */
  valueCommitted(event: Event) {
    dispatchChange(this, (event.target as HTMLInputElement).value);
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }
}

/** The events `gui-markdown` fires, with their types. */
export const GuiMarkdownEvents = {
  ...valueEvents<GuiMarkdown['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-markdown': GuiMarkdown;
  }
}

safeDefine('gui-markdown', GuiMarkdown);
