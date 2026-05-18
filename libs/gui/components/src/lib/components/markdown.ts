import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';
import { Dependencies, MarkdownProps } from '@golemui/gui-shared';
import { styleMap } from 'lit-html/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import './markdown-text';

@customElement('gui-markdown')
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
        <nav class="gui-markdown__toolbar">
          <ul>
            ${(this.tools ?? ['H', 'B', 'I', 'S', 'Q', 'L', '|', 'OL', 'UL']).map((tool) =>
              this.renderToolbarItem(tool),
            )}
            <li>
              <button
                type="button"
                tabindex="0"
                class=${classMap({
                  'gui-markdown__toolbar-button': true,
                  'gui-markdown__toolbar-button--active': this.splitViewActive,
                })}
                @click=${this.splitView}
                title=${this.splitViewTitle ?? 'Split View'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 256 256"
                >
                  <path
                    d="M200,40H56A16,16,0,0,0,40,56V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40ZM56,56h64V200H56ZM200,200H136V56h64V200Z"
                  ></path>
                </svg>
              </button>
            </li>
          </ul>
        </nav>
        <textarea
          id=${ifDefined(this.uid)}
          class=${classMap(fieldClasses)}
          style=${styleMap(autoGrowStyles)}
          ?required=${templateData.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          placeholder=${ifDefined(templateData.placeholder)}
          autocomplete=${this.autocomplete || nothing}
          .value=${this.value || ''}
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
              >
                <gui-markdown-text
                  .md=${this.value || ''}
                  .dependencies=${this.dependencies}
                ></gui-markdown-text>
              </section>
            `
          : nothing}
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
    this.splitViewActive = !this.splitViewActive;
  }

  private renderToolbarItem(token: string) {
    switch (token) {
      case 'H':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('heading')}
            @click=${this.applyFormat('# ', '', 'heading')}
            title=${this.headingTitle ?? 'Heading'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M212,56V200a12,12,0,0,1-24,0V140H68v60a12,12,0,0,1-24,0V56a12,12,0,0,1,24,0v60H188V56a12,12,0,0,1,24,0Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'B':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('bold')}
            @click=${this.applyFormat('**', '**', 'bold')}
            title=${this.boldTitle ?? 'Bold'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M185.08,114.46A48,48,0,0,0,148,36H80A12,12,0,0,0,68,48V200a12,12,0,0,0,12,12h80a52,52,0,0,0,25.08-97.54ZM92,60h56a24,24,0,0,1,0,48H92Zm68,128H92V132h68a28,28,0,0,1,0,56Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'I':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('italic')}
            @click=${this.applyFormat('_', '_', 'italic')}
            title=${this.italicTitle ?? 'Italic'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M204,56a12,12,0,0,1-12,12H160.65l-40,120H144a12,12,0,0,1,0,24H64a12,12,0,0,1,0-24H95.35l40-120H112a12,12,0,0,1,0-24h80A12,12,0,0,1,204,56Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'S':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('strikethrough')}
            @click=${this.applyFormat('~~', '~~', 'strikethrough')}
            title=${this.strikethroughTitle ?? 'Strikethrough'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M224,128a8,8,0,0,1-8,8H175.93c9.19,7.11,16.07,17.2,16.07,32,0,13.34-7,25.7-19.75,34.79C160.33,211.31,144.61,216,128,216s-32.33-4.69-44.25-13.21C71,193.7,64,181.34,64,168a8,8,0,0,1,16,0c0,17.35,22,32,48,32s48-14.65,48-32c0-14.85-10.54-23.58-38.77-32H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM76.33,104a8,8,0,0,0,7.61-10.49A17.3,17.3,0,0,1,83.11,88c0-18.24,19.3-32,44.89-32,18.84,0,34.16,7.42,41,19.85a8,8,0,0,0,14-7.7C173.33,50.52,152.77,40,128,40,93.29,40,67.11,60.63,67.11,88a33.73,33.73,0,0,0,1.62,10.49A8,8,0,0,0,76.33,104Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'Q':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('quote')}
            @click=${this.applyFormat('> ', '', 'quote')}
            title=${this.quoteTitle ?? 'Quote'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M100,52H40A20,20,0,0,0,20,72v64a20,20,0,0,0,20,20H96v4a28,28,0,0,1-28,28,12,12,0,0,0,0,24,52.06,52.06,0,0,0,52-52V72A20,20,0,0,0,100,52Zm-4,80H44V76H96ZM216,52H156a20,20,0,0,0-20,20v64a20,20,0,0,0,20,20h56v4a28,28,0,0,1-28,28,12,12,0,0,0,0,24,52.06,52.06,0,0,0,52-52V72A20,20,0,0,0,216,52Zm-4,80H160V76h52Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'L':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('link')}
            @click=${this.applyFormat('[', '](url)', 'link')}
            title=${this.linkTitle ?? 'Link'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M117.18,188.74a12,12,0,0,1,0,17l-5.12,5.12A58.26,58.26,0,0,1,70.6,228h0A58.62,58.62,0,0,1,29.14,127.92L63.89,93.17a58.64,58.64,0,0,1,98.56,28.11,12,12,0,1,1-23.37,5.44,34.65,34.65,0,0,0-58.22-16.58L46.11,144.89A34.62,34.62,0,0,0,70.57,204h0a34.41,34.41,0,0,0,24.49-10.14l5.11-5.12A12,12,0,0,1,117.18,188.74ZM226.83,45.17a58.65,58.65,0,0,0-82.93,0l-5.11,5.11a12,12,0,0,0,17,17l5.12-5.12a34.63,34.63,0,1,1,49,49L175.1,145.86A34.39,34.39,0,0,1,150.61,156h0a34.63,34.63,0,0,1-33.69-26.72,12,12,0,0,0-23.38,5.44A58.64,58.64,0,0,0,150.56,180h.05a58.28,58.28,0,0,0,41.47-17.17l34.75-34.75a58.62,58.62,0,0,0,0-82.91Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'OL':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('orderedList')}
            @click=${this.applyFormat('1. ', '', 'orderedList')}
            title=${this.orderedListTitle ?? 'Ordered List'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M228,128a12,12,0,0,1-12,12H116a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM116,76H216a12,12,0,0,0,0-24H116a12,12,0,0,0,0,24ZM216,180H116a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24ZM44,59.31V104a12,12,0,0,0,24,0V40A12,12,0,0,0,50.64,29.27l-16,8a12,12,0,0,0,9.36,22Zm39.73,96.86a27.7,27.7,0,0,0-11.2-18.63A28.89,28.89,0,0,0,32.9,143a27.71,27.71,0,0,0-4.17,7.54,12,12,0,0,0,22.55,8.21,4,4,0,0,1,.58-1,4.78,4.78,0,0,1,6.5-.82,3.82,3.82,0,0,1,1.61,2.6,3.63,3.63,0,0,1-.77,2.77l-.13.17L30.39,200.82A12,12,0,0,0,40,220H72a12,12,0,0,0,0-24H64l14.28-19.11A27.48,27.48,0,0,0,83.73,156.17Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case 'UL':
        return html`<li>
          <button
            type="button"
            tabindex="0"
            class=${this.toolbarBtnClass('unorderedList')}
            @click=${this.applyFormat('- ', '', 'unorderedList')}
            title=${this.unorderedListTitle ?? 'Unordered List'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path
                d="M76,64A12,12,0,0,1,88,52H216a12,12,0,0,1,0,24H88A12,12,0,0,1,76,64Zm140,52H88a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Zm0,64H88a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24ZM44,112a16,16,0,1,0,16,16A16,16,0,0,0,44,112Zm0-64A16,16,0,1,0,60,64,16,16,0,0,0,44,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,44,176Z"
              ></path>
            </svg>
          </button>
        </li>`;
      case '|':
        return html`<li>
          <span class="gui-markdown__toolbar-separator">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <path d="M140,24V232a12,12,0,0,1-24,0V24a12,12,0,0,1,24,0Z"></path>
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

if (typeof customElements !== 'undefined' && !customElements.get('gui-markdown')) {
  customElements.define('gui-markdown', GuiMarkdown);
}
