import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { GUIPopupController } from '../controllers/popup.controller';
import { createIntersectionObserver } from './tabs';
import { addErrors } from '../utils/templates';
import {
  CHECK_SQUARE_PATH,
  NOTE_PENCIL_PATH,
  X_CIRCLE_PATH,
  X_SQUARE_PATH,
  spinnerIcon,
} from '../utils/icons';
import { GuiElement } from '../gui-element';
import { message, optionalName, requiredName } from '../utils/messages';
import { dispatch, fires } from '../utils/events';

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
  /**
   * The host is doing async work on this item (e.g. awaiting a server-side
   * removal). The × is replaced by an indeterminate spinner, the pill gets
   * `aria-busy`, and Delete/Backspace and the × no longer emit `gui-pill-remove`
   * — so a removal cannot be requested twice while one is in flight.
   */
  busy?: boolean;
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

/**
 * A scrollable strip of dismissable / clickable chips with an
 * optional count-bubble fallback that opens a dropdown listing every item when
 * the host shrinks below the compact threshold.
 *
 * Owned behaviors:
 *   - horizontal scroll + start/end shadow gradients (via sentinel observers)
 *   - keyboard nav between pills (ArrowLeft/Right, Home/End)
 *   - Delete/Backspace → emits `gui-pill-remove`; host owns the array mutation
 *   - `item.busy` → spinner in the × slot, `aria-busy`, no `gui-pill-remove` until cleared
 *   - count-bubble + dropdown + outside-click-to-close
 *
 * The host is responsible for placing focus when the strip becomes empty
 * (listen to `gui-pill-remove` and call `.focus()` on the host's anchor element).
 *
 * @fires gui-pill-click - A pill body was clicked (`clickable` only). `detail.key` is the pill's
 *   key.
 * @fires gui-pill-remove - The × was pressed, or Delete/Backspace on a focused pill. `detail.key`
 *   is the pill's key.
 * @fires gui-dropdown-toggle - The count bubble opened or closed its dropdown. `detail.open` is
 *   the new state.
 * @fires gui-pill-keydown - A key the strip does not handle, or one at its boundaries, so the host
 *   can intercept it (for example to focus its own input on ArrowRight past the end). `detail`
 *   has the pill `key` and the keyboard `event`.
 * @fires gui-pill-exit - Focus left the pills involuntarily (Escape closed the dropdown); the host
 *   should restore focus to its anchor element. `detail` has the `key` and the `reason`.
 * @fires gui-pill-focus - A pill received focus (`editable` hosts only). `detail.key` is its key.
 * @fires gui-pills-blur - Focus left the pills (`editable` hosts only).
 * @fires gui-pill-edit - The edit icon was pressed, or F2 or E on a focused pill (`editable` hosts
 *   only). `detail.key` is the pill's key.
 * @fires gui-pill-edit-confirm - The confirm icon was pressed on the pill being edited.
 *   `detail.key` is its key.
 * @fires gui-pill-edit-cancel - The cancel icon was pressed on the pill being edited. `detail.key`
 *   is its key.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiPills extends GuiElement {
  /** The pills. */
  @property({ type: Array }) items: GuiPillItem[] = [];

  /** Makes the pill bodies clickable, firing `gui-pill-click`. */
  @property({ type: Boolean }) clickable = false;
  /** Adds a remove button to each pill, unless the pills are disabled or read-only. */
  @property({ type: Boolean }) removable = true;
  /** Collapses the pills into a count with a dropdown when they do not fit. */
  @property({ type: Boolean }) bubble = true;
  /** When false, pills are not in the tab cycle (entered via ArrowLeft instead). */
  @property({ type: Boolean }) tabbable = true;
  /** Disables the pills. */
  @property({ type: Boolean }) disabled = false;
  /** Shows the pills without remove buttons or editing. */
  @property({ type: Boolean, attribute: 'readonly' }) readOnly = false;

  /** When true, clickable pills expose selection as toggle-button semantics (aria-pressed). */
  @property({ type: Boolean }) editable = false;
  /** Key of the pill selected by the host's allowEdit flow. */
  @property({ type: String, attribute: 'selected-key' }) selectedKey: string | undefined =
    undefined;
  /** Key of the pill with an in-flight edit session (its label live-previews the working value). */
  @property({ type: String, attribute: 'editing-key' }) editingKey: string | undefined = undefined;

  /** Tooltip labels for the `editable` action icons rendered inside the pills. */
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined;
  /** Tooltip of the confirm button of the pill being edited. */
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel: string | undefined;
  /** Tooltip of the cancel button of the pill being edited. */
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined;

  /** Accessible name of each remove button. */
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined;
  /** Icon class name of the remove button, replacing the default ×. */
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined;
  /**
   * Accessible name of the count shown when the items do not fit. `{count}` is the number of items.
   * An empty value keeps the default.
   */
  @property({ type: String, attribute: 'compact-aria-label' }) compactAriaLabel: string | undefined;
  /** Accessible name of the pill strip. An empty value removes it. */
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel: string | undefined;

  /** Errors repeated inside the dropdown. */
  @property({ type: Array }) errors: string[] | undefined = undefined;
  /** Whether the field was touched: errors wait for it unless unset. */
  @property({ type: Boolean }) touched = false;

  @state() private _isStartVisible = true;
  @state() private _isEndVisible = true;

  private _popup = new GUIPopupController(this, {
    isDisabled: () => this.disabled || this.readOnly,
    clickIntent: () => 'ignore',
    keyToggleMode: 'openClose',
    focusPopupSelector: '.gui-pills__dropdown .gui-pills__pill',
    onOpenChanged: (open) =>
      dispatch<GuiPillsDropdownEventDetail>(this, 'gui-dropdown-toggle', { open }),
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
        // Host is responsible for moving focus elsewhere (via gui-pill-remove).
        if (this._showDropdown) this.closeDropdown();
        return;
      }
      const safeIndex = Math.max(0, Math.min(target, total - 1));
      this.focusPillAt(safeIndex);
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('focusout', this.onPillsFocusOut);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('focusout', this.onPillsFocusOut);
    this.disconnectObservers();
  }

  /**
   * Focus left the pills subtree for somewhere else (a segment, the calendar,
   * outside the widget): editable hosts move their selection with focus, so
   * they get a chance to drop it. Moves between pills stay silent.
   */
  private onPillsFocusOut = (e: FocusEvent) => {
    if (!this.editable) return;
    const related = e.relatedTarget as Node | null;
    if (related && this.contains(related)) return;
    dispatch(this, 'gui-pills-blur');
  };

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
          aria-label=${optionalName('selectedItems', this.toolbarAriaLabel) ?? nothing}
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

  private get dropdownId(): string {
    return `${this.uid}_pills_dropdown`;
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
          aria-label=${requiredName('itemCount', this.compactAriaLabel, { count })}
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
        aria-label=${optionalName('selectedItems', this.toolbarAriaLabel) ?? nothing}
      >
        <div class="gui-pills__dropdown-list">
          ${repeat(
            this.items,
            (item) => `dd-${item.key}`,
            (item, index) => this.renderPill(item, index, true),
          )}
        </div>
        ${addErrors(this.uid, { errors: this.errors, touched: this.touched }, { variant: 'pills' })}
      </div>
    `;
  }

  /** Whether the pills show their remove button: never while disabled or read-only. */
  private get isRemovable(): boolean {
    return this.removable && !this.disabled && !this.readOnly;
  }

  private renderPill(item: GuiPillItem, index: number, inDropdown: boolean) {
    const isClickable = this.clickable && !this.disabled && !this.readOnly;
    const isSelected = item.key === this.selectedKey;
    const isEditing = item.key === this.editingKey;
    const isBusy = !!item.busy;
    const showEditActions = this.editable && isClickable;
    const descriptionHints = [
      showEditActions && !isEditing ? item.editAriaLabel : undefined,
      this.isRemovable && !isEditing && !isBusy
        ? message('remove', this.removeAriaLabel)
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
          'gui-pills__pill--busy': isBusy,
        })}
        data-key=${item.key}
        data-index=${index}
        data-in-dropdown=${inDropdown}
        tabindex=${this.tabbable && !this.disabled && !this.readOnly ? 0 : -1}
        ?disabled=${this.disabled || this.readOnly}
        aria-pressed=${this.editable && isClickable ? String(isSelected) : nothing}
        aria-busy=${isBusy ? 'true' : nothing}
        aria-label=${item.ariaLabel ?? item.label}
        aria-description=${descriptionHints.length ? descriptionHints.join('. ') : nothing}
        @click=${(e: Event) => this.onPillClick(e, item)}
        @focus=${this.handlePillFocus}
        @keydown=${(e: KeyboardEvent) => this.onPillKeydown(e, item, index)}
      >
        <span class="gui-pills__pill-text">${item.label}</span>
        ${showEditActions && isEditing
          ? html`
              ${this.renderPillAction(
                'edit-cancel',
                message('cancelEditRange', this.cancelEditLabel),
                X_SQUARE_PATH,
                () => this.emitEditAction('gui-pill-edit-cancel', item.key),
              )}
              ${this.renderPillAction(
                'edit-confirm',
                message('confirmEditRange', this.confirmEditLabel),
                CHECK_SQUARE_PATH,
                () => this.emitEditAction('gui-pill-edit-confirm', item.key),
              )}
            `
          : nothing}
        ${showEditActions && !isEditing
          ? this.renderPillAction(
              'edit',
              message('editRange', this.editLabel),
              NOTE_PENCIL_PATH,
              () => this.emitEditAction('gui-pill-edit', item.key),
            )
          : nothing}
        ${this.removable && !isEditing
          ? isBusy
            ? this.renderBusy()
            : this.isRemovable
              ? this.renderRemoveButton(item)
              : nothing
          : nothing}
      </button>
    `;
  }

  /**
   * The spinner that takes the × slot while `item.busy`. Same aria-hidden span
   * shape as the action icons; it has no click handler, so the only way to
   * request another removal is for the host to clear `busy` first.
   */
  private renderBusy() {
    return html`
      <span
        class="gui-pills__pill-busy gui-spinner"
        data-cy=${`${this.uid}_pill-busy`}
        aria-hidden="true"
        @mousedown=${(e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${spinnerIcon()}
      </span>
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
        data-cy=${`${this.uid}_pill-${kind}`}
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
          if (this.isRemovable) this.emitRemove(item.key, this.items.indexOf(item));
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
              <path d=${X_CIRCLE_PATH}></path>
            </svg>`}
      </span>
    `;
  }

  private onPillClick(e: Event, item: GuiPillItem) {
    if (!this.clickable || this.disabled || this.readOnly) return;
    e.stopPropagation();
    dispatch<GuiPillEventDetail>(this, 'gui-pill-click', { key: item.key });
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
      dispatch<GuiPillEventDetail>(this, 'gui-pill-focus', { key });
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
      // A busy pill swallows the key: its removal is already in flight.
      if (!item.busy) this.emitRemove(item.key, index);
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
      this.emitEditAction('gui-pill-edit', item.key);
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && this.clickable) {
      e.preventDefault();
      dispatch<GuiPillEventDetail>(this, 'gui-pill-click', { key: item.key });
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
    dispatch<GuiPillEventDetail>(this, 'gui-pill-remove', { key });
  }

  private emitEditAction(
    type: 'gui-pill-edit' | 'gui-pill-edit-confirm' | 'gui-pill-edit-cancel',
    key: string,
  ) {
    if (type === 'gui-pill-edit' && this._showDropdown) this._popup.suppressNextFocusOut();
    dispatch<GuiPillEventDetail>(this, type, { key });
  }

  private emitExit(key: string, reason: GuiPillExitEventDetail['reason']) {
    dispatch<GuiPillExitEventDetail>(this, 'gui-pill-exit', { key, reason });
  }

  private emitKeydown(key: string, event: KeyboardEvent) {
    dispatch<GuiPillKeydownEventDetail>(this, 'gui-pill-keydown', { key, event });
  }

  // ─── Focus ───────────────────────────────────────────────────────────────

  /**
   * Programmatically focus the pill at the given index. In dropdown mode,
   * focuses the corresponding pill in the dropdown overlay; otherwise in the
   * strip. Useful for hosts that want to "enter" the pill list from outside
   * (e.g. tags' ArrowLeft from the input).
   *
   * @internal
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

  /**
   * Open the dropdown and focus its first pill. No-op if `bubble` is false.
   *
   * @internal
   */
  openDropdown() {
    if (!this.bubble || this._showDropdown) return;
    this._popup.openAndFocus();
  }

  /** @internal */
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

/** The events `gui-pills` fires, with their types. */
export const GuiPillsEvents = {
  'gui-pill-click': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-remove': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-focus': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-edit': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-edit-confirm': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-edit-cancel': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-pill-exit': fires<CustomEvent<GuiPillExitEventDetail>>(),
  'gui-pill-keydown': fires<CustomEvent<GuiPillKeydownEventDetail>>(),
  'gui-pills-blur': fires(),
  'gui-dropdown-toggle': fires<CustomEvent<GuiPillsDropdownEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-pills': GuiPills;
  }
}

safeDefine('gui-pills', GuiPills);
