import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { TagsProps } from '@golemui/gui-shared/internals';
import './pills';
import type { GuiPillEventDetail, GuiPillItem, GuiPillKeydownEventDetail, GuiPills } from './pills';
import { styleMap } from 'lit-html/directives/style-map.js';

type TagsSeparator = 'Enter' | ',' | 'Tab' | 'blur' | string;

const DEFAULT_SEPARATORS: TagsSeparator[] = ['Enter', ',', 'Tab', 'blur'];

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

  private getSeparators(): TagsSeparator[] {
    return this.separators && this.separators.length > 0 ? this.separators : DEFAULT_SEPARATORS;
  }

  private getValue(): string[] {
    return Array.isArray(this.value) ? this.value : [];
  }

  private getRemoveAriaLabel(): string {
    return this.removeAriaLabel ?? 'Remove tag';
  }

  private pillKey(tag: string, index: number): string {
    return `${index}-${tag}`;
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

    const pillItems: GuiPillItem[] = tags.map((tag, index) => ({
      key: this.pillKey(tag, index),
      label: tag,
    }));

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
            ? html`<span
                class=${classMap(iconClassMap)}
                data-icon=${this.icon}
                aria-hidden="true"
              ></span>`
            : nothing}

          <gui-pills
            class="gui-tags__pills"
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${'Selected tags'}
            .items=${pillItems}
            .removable=${true}
            .clickable=${false}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.getRemoveAriaLabel()}
            .removeIcon=${this.removeIcon}
            .compactAriaLabel=${`${tags.length} tags`}
            @pillremove=${this.onPillRemove}
            @pillkeydown=${this.onPillKeydown}
          ></gui-pills>

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

        ${addErrors(this.uid as string, templateData)}
      </div>
    `;
  }

  private onPillRemove = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const tags = this.getValue();
    const idx = tags.findIndex((tag, i) => this.pillKey(tag, i) === e.detail.key);
    if (idx < 0) return;
    const next = tags.filter((_, i) => i !== idx);
    this.emitChange(next);
    if (next.length === 0) {
      // Strip is gone; return focus to the input.
      requestAnimationFrame(() => this.focusInput());
    }
  };

  private onPillKeydown = (e: CustomEvent<GuiPillKeydownEventDetail>) => {
    const ev = e.detail.event;
    // ArrowRight past the last pill (in strip mode) → return focus to input.
    if (ev.key === 'ArrowRight' && !this.isDropdownOpen()) {
      this.focusInput();
    }
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

    const tags = this.getValue();
    const isCompact = this.isCompactMode();

    // Compact mode: ArrowDown opens the dropdown — visually pills are now
    // "below" the input as a dropdown, not "to the left" as a strip, so
    // ArrowLeft would be confusing here. Lands on the FIRST pill (top of list).
    if (e.key === 'ArrowDown' && isCompact && tags.length > 0) {
      e.preventDefault();
      this.enterPillList(0);
      return;
    }

    // Strip mode: ArrowLeft enters the strip at the last pill, but only when
    // the caret is at position 0 with no selection — otherwise it's normal
    // cursor movement inside the draft.
    if (e.key === 'ArrowLeft' && !isCompact && caretAtStart && tags.length > 0) {
      e.preventDefault();
      this.enterPillList(tags.length - 1);
      return;
    }

    if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      e.preventDefault();
      this.enterPillList(tags.length - 1);
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

  private onPaste(e: ClipboardEvent) {
    if (this.disabled || this.readOnly) return;
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text) return;

    const separators = this.getSeparators();
    const charSeparators = separators.filter((s) => s !== 'Enter' && s !== 'Tab' && s !== 'blur');
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

  private getPills(): GuiPills | null {
    return this.querySelector<GuiPills>('gui-pills');
  }

  private isDropdownOpen(): boolean {
    const pills = this.getPills();
    return !!pills?.querySelector('.gui-pills__dropdown');
  }

  /** True when the host wrapper has shrunk past the compact threshold and
   *  gui-pills is displaying the bubble instead of the strip. */
  private isCompactMode(): boolean {
    const pills = this.getPills();
    if (!pills) return false;
    const wrapper = pills.querySelector<HTMLElement>('.gui-pills__strip-wrapper');
    return wrapper ? getComputedStyle(wrapper).display === 'none' : false;
  }

  /**
   * Enter the pill list at `index`. In compact mode the strip is hidden, so
   * we open the dropdown overlay first so the user can see the focused pill.
   */
  private enterPillList(index: number) {
    const pills = this.getPills();
    if (!pills) return;
    if (this.isCompactMode()) {
      pills.openDropdown();
      requestAnimationFrame(() => pills.focusPillAt(index));
    } else {
      pills.focusPillAt(index);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-tags': GuiTags;
  }
}

safeDefine('gui-tags', GuiTags);
