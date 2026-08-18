import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { GUIPopupController } from '../controllers/popup.controller';
import { createIntersectionObserver } from './tabs';
import { addErrors } from '../utils/templates';

export interface GuiPillItem {
  /** Stable identity used for `repeat()` keys and event payloads. */
  key: string;
  /** Pre-formatted text the pill displays. */
  label: string;
  /** Override for the pill button's accessible name. Defaults to `label`. */
  ariaLabel?: string;
  /**
   * Editable-pill action hint, already interpolated with the range label
   * (e.g. "Edit range Jan 5 - Jan 10"). Joined into the pill's
   * `aria-description` — the edit icon itself is aria-hidden, mirroring the
   * remove icon's pattern.
   */
  editAriaLabel?: string;
}

export interface GuiPillEventDetail {
  key: string;
}

export interface GuiPillKeydownEventDetail {
  key: string;
  event: KeyboardEvent;
}

export interface GuiPillsDropdownEventDetail {
  open: boolean;
}

export interface GuiPillExitEventDetail {
  key: string;
  reason: 'escape';
}

// Phosphor icons (regular weight), matching the built-in remove icon.
const NOTE_PENCIL_PATH =
  'M229.66,58.34l-32-32a8,8,0,0,0-11.32,0l-96,96A8,8,0,0,0,88,128v32a8,8,0,0,0,8,8h32a8,8,0,0,0,5.66-2.34l96-96A8,8,0,0,0,229.66,58.34ZM124.69,152H104V131.31l64-64L188.69,88ZM200,76.69,179.31,56,192,43.31,212.69,64ZM224,128v80a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h80a8,8,0,0,1,0,16H48V208H208V128a8,8,0,0,1,16,0Z';
const X_SQUARE_PATH =
  'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32Z';
const CHECK_SQUARE_PATH =
  'M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM224,48V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM208,208V48H48V208H208Z';

/**
 * `<gui-pills>` — a scrollable strip of dismissable / clickable chips with an
 * optional count-bubble fallback that opens a dropdown listing every item when
 * the host shrinks below the compact threshold.
 *
 * Owned behaviors:
 *   - horizontal scroll + start/end shadow gradients (via sentinel observers)
 *   - keyboard nav between pills (ArrowLeft/Right, Home/End)
 *   - Delete/Backspace → emits `pillremove`; host owns the array mutation
 *   - count-bubble + dropdown + outside-click-to-close
 *
 * The host is responsible for placing focus when the strip becomes empty
 * (listen to `pillremove` and call `.focus()` on the host's anchor element).
 *
 * Events (all bubble + composed):
 *   - `pillclick`     { key }                — fired when `clickable` and a pill body is clicked
 *   - `pillremove`    { key }                — × pressed or Delete/Backspace on a focused pill
 *   - `dropdowntoggle`{ open }               — bubble opened/closed the dropdown
 *   - `pillkeydown`   { key, event }         — re-emitted for unhandled keys and at strip
 *                                              boundaries; host can intercept (e.g. to
 *                                              focus its own input on ArrowRight-past-end)
 *   - `pillexit`      { key, reason }        — focus left the pills involuntarily (Escape
 *                                              closed the dropdown); host should restore
 *                                              focus to its anchor element
 *   - `pillfocus`     { key }                — a pill received focus (`editable` hosts
 *                                              only); hosts follow it with their selection
 *   - `pilledit`      { key }                — edit icon pressed, or F2 / E on a focused
 *                                              pill (`editable` hosts only)
 *   - `pilleditconfirm` { key }              — confirm icon pressed on the editing pill
 *   - `pilleditcancel`  { key }              — cancel icon pressed on the editing pill
 */
export class GuiPills extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: Array }) items: GuiPillItem[] = [];

  @property({ type: Boolean }) clickable = false;
  @property({ type: Boolean }) removable = true;
  @property({ type: Boolean }) bubble = true;
  /** When false, pills are not in the tab cycle (entered via ArrowLeft instead). */
  @property({ type: Boolean }) tabbable = true;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly = false;

  /** When true, clickable pills expose selection as toggle-button semantics (aria-pressed). */
  @property({ type: Boolean }) editable = false;
  /** Key of the pill selected by the host's allowEdit flow. */
  @property({ type: String, attribute: 'selected-key' }) selectedKey: string | undefined =
    undefined;
  /** Key of the pill with an in-flight edit session (its label live-previews the working value). */
  @property({ type: String, attribute: 'editing-key' }) editingKey: string | undefined = undefined;

  /** Tooltip labels for the `editable` action icons rendered inside the pills. */
  @property({ type: String, attribute: 'edit-label' }) editLabel = 'Edit';
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel = 'Confirm';
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel = 'Cancel';

  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel = 'Remove';
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined;
  @property({ type: String, attribute: 'compact-aria-label' }) compactAriaLabel: string | undefined;
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel = 'Selected items';

  @property({ type: Array }) errors: string[] | undefined = undefined;
  @property({ type: Boolean }) touched = false;

  @state() private _isStartVisible = true;
  @state() private _isEndVisible = true;

  private _popup = new GUIPopupController(this, {
    isDisabled: () => this.disabled || this.readOnly,
    clickIntent: () => 'ignore',
    keyToggleMode: 'openClose',
    focusPopupSelector: '.gui-pills__dropdown .gui-pills__pill',
    onOpenChanged: (open) => {
      this.dispatchEvent(
        new CustomEvent<GuiPillsDropdownEventDetail>('dropdowntoggle', {
          detail: { open },
          bubbles: true,
          composed: true,
        }),
      );
    },
  });

  private get _showDropdown(): boolean {
    return this._popup.open;
  }

  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;
  private _pendingFocusIndex: number | null = null;

  override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    this.setupObservers();

    if (this._pendingFocusIndex !== null && changedProperties.has('items')) {
      const target = this._pendingFocusIndex;
      this._pendingFocusIndex = null;
      const total = this.items.length;
      if (total === 0) {
        // Host is responsible for moving focus elsewhere (via pillremove).
        if (this._showDropdown) this.closeDropdown();
        return;
      }
      const safeIndex = Math.max(0, Math.min(target, total - 1));
      this.focusPillAt(safeIndex);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectObservers();
  }

  override render() {
    const total = this.items.length;
    if (total === 0) return nothing;

    return html`
      ${this.renderStrip()} ${this.bubble ? this.renderCompact(total) : nothing}
      ${this.bubble && this._showDropdown ? this.renderDropdown() : nothing}
    `;
  }

  private renderStrip() {
    return html`
      <div
        class=${classMap({
          'gui-pills__strip-wrapper': true,
          'gui-pills--start-shadow': !this._isStartVisible,
          'gui-pills--end-shadow': !this._isEndVisible,
        })}
      >
        <div
          class="gui-pills__strip"
          role="toolbar"
          aria-label=${this.toolbarAriaLabel}
          tabindex="-1"
        >
          <span class="gui-sentinel gui-sentinel__start"></span>
          ${repeat(
            this.items,
            (item) => item.key,
            (item, index) => this.renderPill(item, index, false),
          )}
          <span class="gui-sentinel gui-sentinel__end"></span>
        </div>
      </div>
    `;
  }

  private get dropdownId(): string | undefined {
    return this.uid ? `${this.uid}_pills_dropdown` : undefined;
  }

  private renderCompact(count: number) {
    return html`
      <div class="gui-pills__compact">
        <button
          type="button"
          class=${classMap({
            'gui-pills__count': true,
            'gui-pills__count--has-selection': !!this.selectedKey,
            'gui-pills__count--editing': !!this.editingKey,
          })}
          aria-label=${this.compactAriaLabel ?? `${count} items`}
          aria-haspopup="true"
          aria-expanded=${this._showDropdown}
          aria-controls=${this.dropdownId ?? nothing}
          ?disabled=${this.disabled || this.readOnly}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.toggleDropdown();
          }}
          @keydown=${this.onCountKeydown}
        >
          ${count}
        </button>
      </div>
    `;
  }

  private renderDropdown() {
    return html`
      <div
        id=${this.dropdownId ?? nothing}
        class="gui-pills__dropdown"
        role="toolbar"
        aria-orientation="vertical"
        aria-label=${this.toolbarAriaLabel}
      >
        <div class="gui-pills__dropdown-list">
          ${repeat(
            this.items,
            (item) => `dd-${item.key}`,
            (item, index) => this.renderPill(item, index, true),
          )}
        </div>
        ${addErrors(
          this.uid ?? '',
          { errors: this.errors, touched: this.touched },
          { variant: 'pills' },
        )}
      </div>
    `;
  }

  private renderPill(item: GuiPillItem, index: number, inDropdown: boolean) {
    const isClickable = this.clickable && !this.disabled && !this.readOnly;
    const isSelected = item.key === this.selectedKey;
    const isEditing = item.key === this.editingKey;
    const showEditActions = this.editable && isClickable;
    const descriptionHints = [
      showEditActions && !isEditing ? item.editAriaLabel : undefined,
      this.removable && !this.disabled && !this.readOnly && !isEditing
        ? this.removeAriaLabel
        : undefined,
    ].filter(Boolean);
    return html`
      <button
        type="button"
        class=${classMap({
          'gui-pills__pill': true,
          'gui-pills__pill--clickable': isClickable,
          'gui-pills__pill--selected': isSelected,
          'gui-pills__pill--editing': isEditing,
        })}
        data-key=${item.key}
        data-index=${index}
        data-in-dropdown=${inDropdown}
        tabindex=${this.tabbable && !this.disabled && !this.readOnly ? 0 : -1}
        ?disabled=${this.disabled || this.readOnly}
        aria-pressed=${this.editable && isClickable ? String(isSelected) : nothing}
        aria-label=${item.ariaLabel ?? item.label}
        aria-description=${descriptionHints.length ? descriptionHints.join('. ') : nothing}
        @click=${(e: Event) => this.onPillClick(e, item)}
        @focus=${this.handlePillFocus}
        @keydown=${(e: KeyboardEvent) => this.onPillKeydown(e, item, index)}
      >
        <span class="gui-pills__pill-text">${item.label}</span>
        ${showEditActions && isEditing
          ? html`
              ${this.renderPillAction('edit-cancel', this.cancelEditLabel, X_SQUARE_PATH, () =>
                this.emitEditAction('pilleditcancel', item.key),
              )}
              ${this.renderPillAction(
                'edit-confirm',
                this.confirmEditLabel,
                CHECK_SQUARE_PATH,
                () => this.emitEditAction('pilleditconfirm', item.key),
              )}
            `
          : nothing}
        ${showEditActions && !isEditing
          ? this.renderPillAction('edit', this.editLabel, NOTE_PENCIL_PATH, () =>
              this.emitEditAction('pilledit', item.key),
            )
          : nothing}
        ${this.removable && !isEditing ? this.renderRemoveButton(item) : nothing}
      </button>
    `;
  }

  /**
   * An action icon inside the pill button. A `<span>` so it is aria-hidden
   * and the pill's `aria-description` plus the F2 / E / Enter / Escape keyboard
   * paths carry the accessible equivalents (same pattern as the remove icon).
   */
  private renderPillAction(kind: string, title: string, iconPath: string, act: () => void) {
    return html`
      <span
        class="gui-pills__pill-action gui-pills__pill-action--${kind}"
        title=${title}
        data-cy=${this.uid ? `${this.uid}_pill-${kind}` : nothing}
        aria-hidden="true"
        @mousedown=${(e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        @click=${(e: Event) => {
          e.stopPropagation();
          act();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d=${iconPath}></path>
        </svg>
      </span>
    `;
  }

  private renderRemoveButton(item: GuiPillItem) {
    return html`
      <span
        class="gui-pills__pill-remove"
        aria-hidden="true"
        @mousedown=${(e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        @click=${(e: Event) => {
          e.stopPropagation();
          this.emitRemove(item.key, this.items.indexOf(item));
        }}
      >
        ${this.removeIcon
          ? html`<span
              class=${`gui-widget-icon ${this.removeIcon}`}
              data-icon=${this.removeIcon}
              aria-hidden="true"
            ></span>`
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
      </span>
    `;
  }

  private onPillClick(e: Event, item: GuiPillItem) {
    if (!this.clickable || this.disabled || this.readOnly) return;
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<GuiPillEventDetail>('pillclick', {
        detail: { key: item.key },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handlePillFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
    const key = target.dataset['key'];
    if (this.editable && key) {
      this.dispatchEvent(
        new CustomEvent<GuiPillEventDetail>('pillfocus', {
          detail: { key },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  private onPillKeydown(e: KeyboardEvent, item: GuiPillItem, index: number) {
    if (this.disabled || this.readOnly) {
      this.emitKeydown(item.key, e);
      return;
    }

    if (this.removable && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      e.stopPropagation();
      this.emitRemove(item.key, index);
      return;
    }

    if (
      this.editable &&
      this.clickable &&
      (e.key === 'F2' || e.key === 'e' || e.key === 'E') &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      item.key !== this.editingKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.emitEditAction('pilledit', item.key);
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && this.clickable) {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent<GuiPillEventDetail>('pillclick', {
          detail: { key: item.key },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    const isDropdown = this._showDropdown;
    const prevKey = isDropdown ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isDropdown ? 'ArrowDown' : 'ArrowRight';

    if (e.key === prevKey) {
      e.stopPropagation();
      if (index > 0) {
        e.preventDefault();
        this.focusPillAt(index - 1);
      } else {
        this.emitKeydown(item.key, e);
      }
      return;
    }

    if (e.key === nextKey) {
      e.stopPropagation();
      if (index < this.items.length - 1) {
        e.preventDefault();
        this.focusPillAt(index + 1);
      } else {
        this.emitKeydown(item.key, e);
      }
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      this.focusPillAt(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      this.focusPillAt(this.items.length - 1);
      return;
    }

    if (e.key === 'Escape' && isDropdown) {
      e.preventDefault();
      e.stopPropagation();
      this.closeDropdown();
      this.emitExit(item.key, 'escape');
      return;
    }

    this.emitKeydown(item.key, e);
  }

  private emitRemove(key: string, index: number) {
    this._pendingFocusIndex = index;
    this.dispatchEvent(
      new CustomEvent<GuiPillEventDetail>('pillremove', {
        detail: { key },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitEditAction(type: 'pilledit' | 'pilleditconfirm' | 'pilleditcancel', key: string) {
    if (type === 'pilledit' && this._showDropdown) this._popup.suppressNextFocusOut();
    this.dispatchEvent(
      new CustomEvent<GuiPillEventDetail>(type, {
        detail: { key },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitExit(key: string, reason: GuiPillExitEventDetail['reason']) {
    this.dispatchEvent(
      new CustomEvent<GuiPillExitEventDetail>('pillexit', {
        detail: { key, reason },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitKeydown(key: string, event: KeyboardEvent) {
    this.dispatchEvent(
      new CustomEvent<GuiPillKeydownEventDetail>('pillkeydown', {
        detail: { key, event },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Focus ───────────────────────────────────────────────────────────────

  /**
   * Programmatically focus the pill at the given index. In dropdown mode,
   * focuses the corresponding pill in the dropdown overlay; otherwise in the
   * strip. Useful for hosts that want to "enter" the pill list from outside
   * (e.g. tags' ArrowLeft from the input).
   */
  focusPillAt(index: number) {
    if (this.tryFocusPillAt(index)) return;
    requestAnimationFrame(() => {
      this.tryFocusPillAt(index);
    });
  }

  private tryFocusPillAt(index: number): boolean {
    const selector = this._showDropdown
      ? '.gui-pills__dropdown .gui-pills__pill'
      : '.gui-pills__strip .gui-pills__pill';
    const pills = this.querySelectorAll<HTMLElement>(selector);
    if (pills.length === 0) return false;
    const safe = Math.max(0, Math.min(index, pills.length - 1));
    pills[safe].focus();
    return true;
  }

  /** Open the dropdown and focus its first pill. No-op if `bubble` is false. */
  openDropdown() {
    if (!this.bubble || this._showDropdown) return;
    this._popup.openAndFocus();
  }

  closeDropdown() {
    this._popup.close();
  }

  private toggleDropdown = () => {
    if (this._showDropdown) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  };

  /**
   * ArrowDown on the count bubble opens the popup the button's aria-haspopup
   * advertises. stopPropagation keeps the key from reaching hosts whose
   * trigger-level ArrowDown opens a different popup (multiDropdown's panel
   * would otherwise open and force this dropdown closed).
   */
  private onCountKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    e.stopPropagation();
    if (this._showDropdown) {
      this.focusPillAt(0);
    } else {
      this.openDropdown();
    }
  };

  // ─── Observers ───────────────────────────────────────────────────────────

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
    'gui-pills': GuiPills;
  }
}

safeDefine('gui-pills', GuiPills);
