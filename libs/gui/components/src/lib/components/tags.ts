import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { type TagsProps } from '@golemui/gui-shared';
import { createIntersectionObserver } from './tabs';

type TagsSeparator = 'Enter' | ',' | 'Tab' | 'blur' | string;

const DEFAULT_SEPARATORS: TagsSeparator[] = ['Enter', ',', 'Tab', 'blur'];

@customElement('gui-tags')
export class GuiTags extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Array }) value: string[] | undefined = [];

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: Array }) separators: TagsSeparator[] | undefined = undefined;
  @property({ type: Boolean }) allowDuplicates: boolean | undefined = true;
  @property({ type: Boolean }) trim: boolean | undefined = true;
  @property({ type: Number }) limit: number | undefined = undefined;
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined = undefined;

  @state() private _isStartVisible = true;
  @state() private _isEndVisible = true;
  @state() private _showPillsList = false;

  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.gui-tags-input`),
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
    this.setupObservers();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectObservers();
    this.removeOutsideListeners();
  }

  private getSeparators(): TagsSeparator[] {
    return this.separators && this.separators.length > 0 ? this.separators : DEFAULT_SEPARATORS;
  }

  private getValue(): string[] {
    return Array.isArray(this.value) ? this.value : [];
  }

  private getRemoveAriaLabel(): string {
    return this.removeAriaLabel ?? 'Remove tag';
  }

  override render() {
    const tags = this.getValue();
    const templateData: ControlTemplateData<string[]> & TagsProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: tags,
      placeholder: this.placeholder,
      icon: this.icon,
    };

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
        <div
          class=${classMap({
            'gui-widget-input': true,
            'gui-tags-input': true,
            'gui-tags-input--icon': !!this.icon,
          })}
          role="group"
          aria-label=${this.label ?? 'Tags input'}
        >
          ${this.icon
            ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
            : nothing}
          ${tags.length > 0
            ? html`<div
                  class=${classMap({
                    'gui-tags__pills-wrapper': true,
                    'gui-tags--start-shadow': !this._isStartVisible,
                    'gui-tags--end-shadow': !this._isEndVisible,
                  })}
                >
                  <div class="gui-tags__pills" role="list">
                    <span class="gui-sentinel gui-sentinel__start"></span>
                    ${repeat(
                      tags,
                      (tag, index) => `${index}-${tag}`,
                      (tag, index) => this.renderChip(tag, index),
                    )}
                    <span class="gui-sentinel gui-sentinel__end"></span>
                  </div>
                </div>
                <div class="gui-tags__pills-compact">
                  <button
                    type="button"
                    class="gui-tags__pill--count"
                    aria-label="${tags.length} tags"
                    aria-expanded=${this._showPillsList}
                    ?disabled=${this.disabled || this.readOnly}
                    @click=${this.togglePillsList}
                  >
                    ${tags.length}
                  </button>
                </div>`
            : nothing}

          <input
            type="text"
            id=${this.uid}
            data-cy=${`${this.uid}_tags-input`}
            class="gui-tags__input"
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            placeholder=${this.placeholder || nothing}
            @keydown=${this.onInputKeydown}
            @blur=${this.onInputBlur}
            @paste=${this.onPaste}
            @change=${(e: Event) => e.stopPropagation()}
          />
        </div>
        ${this._showPillsList && tags.length > 0
          ? html`<div class="gui-tags__pills-dropdown" role="list">
              ${repeat(
                tags,
                (tag, index) => `dd-${index}-${tag}`,
                (tag, index) => this.renderChip(tag, index, true),
              )}
            </div>`
          : nothing}

      </div>
      ${addErrors(this.uid as string, templateData)}
    `;
  }

  private renderChip(tag: string, index: number, inDropdown = false) {
    const removeAriaLabel = `${this.getRemoveAriaLabel()}: ${tag}`;
    return html`
      <div
        class="gui-tags__chip"
        role="listitem"
        data-cy=${`${this.uid}_tags-chip-${index}`}
        data-index=${index}
        data-in-dropdown=${inDropdown}
        tabindex="-1"
        aria-label=${removeAriaLabel}
        @focus=${this.handleChipFocus}
        @keydown=${(e: KeyboardEvent) => this.onChipKeydown(e, index)}
      >
        <span class="gui-tags__chip-text">${tag}</span>
        <button
          type="button"
          class="gui-tags__chip-remove"
          tabindex="-1"
          aria-hidden="true"
          ?disabled=${this.disabled || this.readOnly}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.removeChip(index);
          }}
        >
          ${this.removeIcon
            ? html`<span class=${`gui-widget-icon ${this.removeIcon}`} data-icon=${this.removeIcon}></span>`
            : html`<svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 256 256"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"
                ></path>
              </svg>`}
        </button>
      </div>
    `;
  }

  private handleChipFocus = (e: FocusEvent) => {
    (e.target as Element).scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  };

  private onInputKeydown(e: KeyboardEvent) {
    if (this.disabled || this.readOnly) return;

    const input = e.target as HTMLInputElement;
    const separators = this.getSeparators();
    const draft = input.value;
    const caretAtStart = input.selectionStart === 0 && input.selectionEnd === 0;

    if (e.key === 'Enter' && separators.includes('Enter')) {
      e.preventDefault();
      if (this.commitDraft(draft)) input.value = '';
      return;
    }

    if (e.key === ',' && separators.includes(',')) {
      e.preventDefault();
      if (this.commitDraft(draft)) input.value = '';
      return;
    }

    if (e.key === 'Tab' && separators.includes('Tab') && draft.length > 0) {
      // Commit but allow default Tab behavior (focus moves out of widget).
      if (this.commitDraft(draft)) input.value = '';
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      return;
    }

    // ArrowLeft enters the pill list only when the caret is at position 0
    // with no selection — otherwise it's normal cursor movement inside the draft.
    if (e.key === 'ArrowLeft' && caretAtStart) {
      const tags = this.getValue();
      if (tags.length > 0) {
        e.preventDefault();
        this.enterPillList(tags.length - 1);
      }
      return;
    }

    if (e.key === 'Backspace' && draft === '') {
      const tags = this.getValue();
      if (tags.length > 0) {
        e.preventDefault();
        this.enterPillList(tags.length - 1);
      }
      return;
    }
  }

  private onInputBlur(e: FocusEvent) {
    const input = e.target as HTMLInputElement;
    const separators = this.getSeparators();
    const draft = input.value;

    if (draft.length > 0 && separators.includes('blur') && !this.disabled && !this.readOnly) {
      if (this.commitDraft(draft)) input.value = '';
    }

    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onChipKeydown(e: KeyboardEvent, index: number) {
    if (this.disabled || this.readOnly) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      this.removeChip(index);
      return;
    }

    const isDropdown = this._showPillsList;
    const prevKey = isDropdown ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isDropdown ? 'ArrowDown' : 'ArrowRight';

    if (e.key === prevKey) {
      e.preventDefault();
      if (index > 0) this.focusPillAt(index - 1);
      return;
    }

    if (e.key === nextKey) {
      e.preventDefault();
      const tags = this.getValue();
      if (index < tags.length - 1) {
        this.focusPillAt(index + 1);
      } else if (!isDropdown) {
        this.focusInput();
      }
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      this.focusPillAt(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      const tags = this.getValue();
      this.focusPillAt(tags.length - 1);
      return;
    }

    if (e.key === 'Escape' && isDropdown) {
      e.preventDefault();
      this._showPillsList = false;
      this.removeOutsideListeners();
      this.focusInput();
      return;
    }
  }

  private onPaste(e: ClipboardEvent) {
    if (this.disabled || this.readOnly) return;
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text) return;

    const separators = this.getSeparators();
    const charSeparators = separators.filter(
      (s) => s !== 'Enter' && s !== 'Tab' && s !== 'blur',
    );
    if (charSeparators.length === 0) return;

    const splitRegex = new RegExp(
      `[${charSeparators.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')}\n]`,
    );
    if (!splitRegex.test(text)) return;

    e.preventDefault();
    const input = e.target instanceof HTMLInputElement ? e.target : null;
    const draft = input?.value ?? '';
    const parts = (draft + text).split(splitRegex);
    const drafts = parts.slice(0, -1);
    const tail = parts[parts.length - 1] ?? '';

    if (this.commitDraftBatch(drafts) && input) {
      input.value = tail;
    }
  }

  private commitDraft(rawDraft: string): boolean {
    const cleaned = this.trim ? rawDraft.trim() : rawDraft;
    if (cleaned.length === 0) return false;

    const tags = this.getValue();
    if (this.allowDuplicates === false && tags.includes(cleaned)) return true;
    if (this.limit !== undefined && tags.length >= this.limit) return false;

    this.emitChange([...tags, cleaned]);
    return true;
  }

  private commitDraftBatch(rawDrafts: string[]): boolean {
    const tags = this.getValue();
    const next = [...tags];
    for (const raw of rawDrafts) {
      const cleaned = this.trim ? raw.trim() : raw;
      if (cleaned.length === 0) continue;
      if (this.allowDuplicates === false && next.includes(cleaned)) continue;
      if (this.limit !== undefined && next.length >= this.limit) break;
      next.push(cleaned);
    }
    if (next.length === tags.length) return false;
    this.emitChange(next);
    return true;
  }

  private removeChip(index: number) {
    if (this.disabled || this.readOnly) return;
    const tags = this.getValue();
    if (index < 0 || index >= tags.length) return;
    const next = tags.filter((_, i) => i !== index);
    this.emitChange(next);

    if (this._showPillsList && next.length === 0) {
      this._showPillsList = false;
      this.removeOutsideListeners();
    }

    // After removal: focus the next pill, else the previous pill, else the input.
    requestAnimationFrame(() => {
      if (next.length === 0) {
        this.focusInput();
        return;
      }
      const nextIndex = index < next.length ? index : next.length - 1;
      this.focusPillAt(nextIndex);
    });
  }

  private emitChange(next: string[]) {
    this.value = next;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private focusInput() {
    const input = this.querySelector<HTMLInputElement>(`input[id="${this.uid}"]`);
    input?.focus();
  }

  private focusPillAt(index: number) {
    // Wait one frame so any DOM updates (removal, dropdown toggle) settle.
    requestAnimationFrame(() => {
      const selector = this._showPillsList
        ? '.gui-tags__pills-dropdown .gui-tags__chip'
        : '.gui-tags__pills .gui-tags__chip';
      const pills = this.querySelectorAll<HTMLElement>(selector);
      if (pills.length === 0) {
        this.focusInput();
        return;
      }
      const safeIndex = Math.max(0, Math.min(index, pills.length - 1));
      pills[safeIndex].focus();
    });
  }

  /**
   * Enter the pill list at `index`. In compact mode the pill strip is
   * `display: none`, so we open the dropdown overlay first so the user can
   * actually see the focused pill.
   */
  private enterPillList(index: number) {
    const wrapper = this.querySelector<HTMLElement>('.gui-tags__pills-wrapper');
    const wrapperHidden = wrapper ? getComputedStyle(wrapper).display === 'none' : false;
    if (wrapperHidden && !this._showPillsList) {
      this.togglePillsList();
      // togglePillsList focuses the first dropdown pill — override to land
      // on the requested index after the next frame.
      requestAnimationFrame(() => this.focusPillAt(index));
      return;
    }
    this.focusPillAt(index);
  }

  private togglePillsList = () => {
    if (this.disabled || this.readOnly) return;
    this._showPillsList = !this._showPillsList;
    if (this._showPillsList) {
      requestAnimationFrame(() => {
        document.addEventListener('pointerdown', this.handleOutsideInteraction);
        document.addEventListener('focusin', this.handleOutsideInteraction);
        const firstPill = this.querySelector<HTMLElement>(
          '.gui-tags__pills-dropdown .gui-tags__chip',
        );
        firstPill?.focus();
      });
    } else {
      this.removeOutsideListeners();
    }
  };

  private removeOutsideListeners() {
    document.removeEventListener('pointerdown', this.handleOutsideInteraction);
    document.removeEventListener('focusin', this.handleOutsideInteraction);
  }

  private handleOutsideInteraction = (e: Event) => {
    const compact = this.querySelector('.gui-tags__pills-compact');
    const dropdown = this.querySelector('.gui-tags__pills-dropdown');
    const target = e.composedPath()[0] as Node;
    if (!compact?.contains(target) && !dropdown?.contains(target)) {
      this._showPillsList = false;
      this.removeOutsideListeners();
    }
  };

  private setupObservers() {
    const startSentinel = this.querySelector('.gui-sentinel__start');
    const endSentinel = this.querySelector('.gui-sentinel__end');

    if (startSentinel && !this.startObserver) {
      this.startObserver = createIntersectionObserver(
        startSentinel,
        (isIntersecting) => (this._isStartVisible = isIntersecting),
      );
    }

    if (endSentinel && !this.endObserver) {
      this.endObserver = createIntersectionObserver(
        endSentinel,
        (isIntersecting) => (this._isEndVisible = isIntersecting),
      );
    }

    if (!startSentinel && this.startObserver) {
      this.startObserver.disconnect();
      this.startObserver = undefined;
      this._isStartVisible = true;
    }
    if (!endSentinel && this.endObserver) {
      this.endObserver.disconnect();
      this.endObserver = undefined;
      this._isEndVisible = true;
    }
  }

  private disconnectObservers() {
    this.startObserver?.disconnect();
    this.endObserver?.disconnect();
    this.startObserver = undefined;
    this.endObserver = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-tags': GuiTags;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-tags')) {
  customElements.define('gui-tags', GuiTags);
}
