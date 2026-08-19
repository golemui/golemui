import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import type { TimeRange } from '@golemui/gui-shared/internals';
import './range-time-input';
import type { GuiRangeTimeInput } from './range-time-input';
import './time-list';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import {
  buildTimeOptions,
  compareISOTimes,
  isTimeRangeDisabled,
  oneStepAfterISOTime,
  type HourFormat,
} from '../utils/time';
import { addErrors, addIcon, addLabel } from '../utils/templates';
import {
  INVALID_DISABLED_TIME_RANGE_MESSAGE,
  INVALID_MAX_TIME_MESSAGE,
  INVALID_MIN_TIME_MESSAGE,
} from '../utils/messages';

export class GuiRangeTimePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) value: TimeRange[] | undefined = [];
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'start-time-aria-label' }) startTimeAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'end-time-aria-label' }) endTimeAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: Number }) height: number | undefined = undefined;
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;

  @query('#time-input') private _inputRef?: GuiRangeTimeInput;

  @state() private _workingIn: string | undefined = undefined;
  @state() private _workingOut: string | undefined = undefined;
  /**
   * Mirror of the embedded input's edit session, fed by its non-bubbling
   * `editStateChange`: while a session is open, list picks reshape the
   * working range but never auto-commit — the session's Confirm owns that.
   */
  @state() private _editing = false;

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-range-time input, gui-range-time button',
    focusPopupSelector: '.gui-time-list__option[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-time-list__option')) return 'ignore';
      return target.closest('.gui-range-time-input__part') ||
        target.closest('.gui-range-time-picker__panel')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'openClose',
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
    // Closing the panel keeps the working endpoints: a half-picked range is
    // restored when the user reopens it.
  });

  /**
   * The single point where the picker reports focus leaving the control: the
   * input settles what is in its fields — committing a complete range,
   * surfacing a half-typed one — and only then does the picker blur, which the
   * form layer reads as "validate now". Blurring first would validate the
   * value the commit is about to replace.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    resolveSyncOnRelatedTarget: true,
    onLeave: () => {
      this._inputRef?.finalizeOnLeave();
      this.dispatchEvent(new CustomEvent('blur'));
    },
  });

  // The pills dropdown and the list panel are mutually exclusive.
  onDropdownToggle = (event: Event) => {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this._popup.open) this._popup.close();
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dropdowntoggle', this.onDropdownToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dropdowntoggle', this.onDropdownToggle);
  }

  /**
   * Bounds for the "time out" list: undefined until an "in" is chosen. Once
   * chosen, the floor is one slot after "in" so `out > in` strictly; when that
   * spills past the end of the day, an empty (min > max) window yields the
   * "no available times" message.
   */
  private get outListBounds(): { minTime: string | undefined; maxTime: string | undefined } {
    if (!this._workingIn) return { minTime: this.minTime, maxTime: this.maxTime };
    const floor = oneStepAfterISOTime(this._workingIn, this.minuteStep);
    if (!floor) return { minTime: '23:59:59', maxTime: '00:00:00' };
    return { minTime: floor, maxTime: this.maxTime };
  }

  override render() {
    const pickerIcon = addIcon('rangeTimePicker', { icon: this.icon });
    const out = this.outListBounds;
    const startLabel = this.startTimeLabel ?? 'Start time';
    const endLabel = this.endTimeLabel ?? 'End time';

    const panel = this._popup.open
      ? html`<div
          class="gui-picker__panel gui-range-time-picker__panel"
          id=${`${this.uid}_popup`}
          role="dialog"
          aria-label=${this.label ?? 'Time list'}
        >
          <div class="gui-range-time-picker__columns">
            <div class="gui-range-time-picker__column">
              <span class="gui-range-time-picker__column-label">${startLabel}</span>
              <gui-time-list
                class="gui-range-time-picker__list"
                .uid=${this.uid}
                .label=${startLabel}
                .value=${this._workingIn}
                .localeId=${this.localeId}
                .hourFormat=${this.hourFormat}
                .minuteStep=${this.minuteStep}
                .minTime=${this.minTime}
                .maxTime=${this.maxTime}
                .disabledRanges=${this.disabledRanges}
                .height=${this.height}
                .itemHeight=${this.itemHeight}
                .noAvailableTimesMessage=${this.noAvailableTimesMessage}
                ?readonly=${this.readOnly}
                @change=${this.onInListChange}
              ></gui-time-list>
            </div>

            <div class="gui-range-time-picker__column">
              <span class="gui-range-time-picker__column-label">${endLabel}</span>
              <gui-time-list
                class="gui-range-time-picker__list"
                .uid=${this.uid}
                .label=${endLabel}
                .value=${this._workingOut}
                .localeId=${this.localeId}
                .hourFormat=${this.hourFormat}
                .minuteStep=${this.minuteStep}
                .minTime=${out.minTime}
                .maxTime=${out.maxTime}
                .disabledRanges=${this.disabledRanges}
                .height=${this.height}
                .itemHeight=${this.itemHeight}
                .noAvailableTimesMessage=${this.noAvailableTimesMessage}
                ?readonly=${this.readOnly}
                @change=${this.onOutListChange}
              ></gui-time-list>
            </div>
          </div>
          ${this.showErrors
            ? addErrors(
                this.uid ?? '',
                { errors: this.errors, touched: this.touched },
                { variant: 'panel' },
              )
            : nothing}
        </div>`
      : nothing;

    return html`
      ${addLabel(
        this.uid ?? '',
        {
          label: this.label,
          hint: this.hint,
          required: this.required,
        },
        false,
        undefined,
        false,
      )}

      <div
        class="gui-widget"
        @keydown=${this.onWidgetKeyDown}
        @click=${this._popup.onAnchorClick}
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-range-time
          id="time-input"
          class=${classMap(pickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .deferFocusLeave=${true}
          .errors=${this.errors}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .allowCustomTime=${this.allowCustomTime ?? false}
          .value=${this.value}
          .icon=${this.icon}
          .localeId=${this.localeId}
          .separator=${this.separator}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.disabledRanges}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .rangeOrderMessage=${this.rangeOrderMessage}
          .disabledRangeMessage=${this.disabledRangeMessage}
          .incompleteMessage=${this.incompleteMessage}
          .removePillAriaLabel=${this.removePillAriaLabel}
          .startTimeAriaLabel=${this.startTimeAriaLabel}
          .endTimeAriaLabel=${this.endTimeAriaLabel}
          .hourAriaLabel=${this.hourAriaLabel}
          .minuteAriaLabel=${this.minuteAriaLabel}
          .dayPeriodAriaLabel=${this.dayPeriodAriaLabel}
          .allowEdit=${this.allowEdit ?? false}
          .editLabel=${this.editLabel}
          .editAriaLabel=${this.editAriaLabel}
          .confirmEditLabel=${this.confirmEditLabel}
          .cancelEditLabel=${this.cancelEditLabel}
          .editStartedMessage=${this.editStartedMessage}
          .editCommittedMessage=${this.editCommittedMessage}
          .editCancelledMessage=${this.editCancelledMessage}
          @blur=${this.onInputBlur}
          @focus=${this._popup.show}
          @change=${this.onInputChange}
          @partsChange=${this.onPartsChange}
          @pillClick=${this.onPillClick}
          @editStateChange=${this.onEditStateChange}
        ></gui-range-time>
        <button
          type="button"
          class="gui-range-time-picker__arrow"
          aria-label=${this.toggleAriaLabel ?? 'Show time list'}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.uid}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path>
          </svg>
        </button>

        ${panel}
      </div>

      ${this.showErrors
        ? addErrors(this.uid ?? '', { errors: this.errors, touched: this.touched })
        : ''}
    `;
  }

  private onToggleClick = (event: Event) => {
    // The wrapper's clickIntent handler must not double-handle the toggle.
    event.stopPropagation();
    if (this._popup.open) {
      this._popup.close();
    } else {
      this._popup.openAndFocus();
    }
  };

  private onInputChange(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value, event.detail.commit !== false);
  }

  /**
   * Mirrors the input's live, in-bounds start/end into the two lists, so typing
   * a value that exists as a slot highlights it (and a typed start enables and
   * floors the end list) — the reverse of a list pick filling the fields.
   */
  private onPartsChange(event: CustomEvent<{ start: string | null; end: string | null }>) {
    event.stopPropagation();
    this._workingIn = event.detail.start ?? undefined;
    this._workingOut = event.detail.end ?? undefined;
  }

  /**
   * The input's per-part blur stays inside the widget: moving from a segment
   * into the panel is not leaving the control, so it must not be reported as
   * a blur (which the form layer reads as "validate now"). The picker reports
   * blur from its own focus-leave check instead.
   */
  private onInputBlur(event: Event) {
    event.stopPropagation();
  }

  private onInListChange(event: CustomEvent) {
    event.stopPropagation();
    const start = event.detail.value as string | undefined;
    this._workingIn = start ?? undefined;
    if (start) this._inputRef?.fillGroup('start', start);
    this.tryCommitWorkingRange();
  }

  private onOutListChange(event: CustomEvent) {
    event.stopPropagation();
    const end = event.detail.value as string | undefined;
    this._workingOut = end ?? undefined;
    if (end) this._inputRef?.fillGroup('end', end);
    this.tryCommitWorkingRange();
  }

  /**
   * Commits once both endpoints are present, whichever order they were picked
   * in — an end chosen before a start simply waits in the fields. A rejected
   * range (reversed, out of bounds, spanning a disabled block) keeps both
   * values on show and closes the panel so its error is visible.
   */
  private tryCommitWorkingRange(): void {
    if (this._editing) return;
    if (!this._workingIn || !this._workingOut || !this._inputRef) return;

    if (this._inputRef.commitFromParts()) {
      this.updateComplete.then(() => {
        this._inListRef()?.scrollToSelectedValue?.();
      });
      return;
    }

    this._popup.close();
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private _inListRef() {
    return this.listRefFor('start');
  }

  private listRefFor(group: 'start' | 'end') {
    const column = group === 'start' ? 'first-child' : 'last-child';
    return this.querySelector<HTMLElement & { scrollToSelectedValue?: () => void }>(
      `.gui-range-time-picker__column:${column} gui-time-list`,
    );
  }

  /**
   * The single funnel every commit passes through — a list pick, a typed Enter
   * — so the working selection is torn down once: the start list deselects and
   * the end list unfloors, ready for the next range. `committed` is false for
   * the input's error-clearing echo, which carries no new pill and must leave
   * a half-entered range alone.
   */
  private commitValue(value: TimeRange[] | null | undefined, committed = true) {
    this.value = value ?? undefined;
    if (committed) {
      this._workingIn = undefined;
      this._workingOut = undefined;
    }
    const error = this.validateBounds(this.value);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null },
        bubbles: true,
        composed: true,
      }),
    );
    if (error) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private validateBounds(value: TimeRange[] | undefined): string | null {
    if (!value || value.length === 0) return null;
    for (const range of value) {
      for (const endpoint of [range.start, range.end]) {
        if (!endpoint) continue;
        if (this.minTime && compareISOTimes(endpoint, this.minTime) < 0) {
          return this.minTimeMessage ?? INVALID_MIN_TIME_MESSAGE;
        }
        if (this.maxTime && compareISOTimes(endpoint, this.maxTime) > 0) {
          return this.maxTimeMessage ?? INVALID_MAX_TIME_MESSAGE;
        }
      }
      if (isTimeRangeDisabled(range.start, range.end, this.disabledRanges)) {
        return this.disabledRangeMessage ?? INVALID_DISABLED_TIME_RANGE_MESSAGE;
      }
    }
    return null;
  }

  private onPillClick() {
    this._popup.show();
  }

  private onEditStateChange = (
    event: CustomEvent<{ selected: TimeRange | null; editing: boolean }>,
  ) => {
    this._editing = event.detail.editing;
  };

  /**
   * Escape layering: an open panel consumes the key first (closing it), then
   * the select-like keyboard behavior gets its turn, then the embedded
   * input's edit session — cancel an open session, then clear the selection.
   */
  private onWidgetKeyDown = (e: KeyboardEvent) => {
    if (this._popup.onAnchorKeyDown(e)) return;
    if (this.onSelectLikeKeyDown(e)) return;
    this._inputRef?.handleSessionEscape(e);
  };

  private onSelectLikeKeyDown(e: KeyboardEvent): boolean {
    if (this.allowCustomTime || this.readOnly || this.disabled) return false;

    const target = e.target as HTMLElement;
    const group = target.closest('[data-group]')?.getAttribute('data-group');
    if (group !== 'start' && group !== 'end') return false;

    if (e.key === 'Enter') {
      this._inputRef?.commitFromParts();
      return true;
    }

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return false;
    e.preventDefault();
    this.stepEndpoint(group, e.key === 'ArrowDown' ? 1 : -1);
    return true;
  }

  /** Moves one endpoint to the adjacent enabled slot of its list. */
  private stepEndpoint(group: 'start' | 'end', direction: 1 | -1) {
    const bounds =
      group === 'start' ? { minTime: this.minTime, maxTime: this.maxTime } : this.outListBounds;
    const options = buildTimeOptions({
      minTime: bounds.minTime,
      maxTime: bounds.maxTime,
      minuteStep: this.minuteStep,
      disabledRanges: this.disabledRanges,
    });
    if (!options.length) return;

    const current = group === 'start' ? this._workingIn : this._workingOut;
    const currentIndex = options.findIndex((option) => option.value === current);
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : options.length - 1) : currentIndex + direction;
    while (index >= 0 && index < options.length && options[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= options.length) return;

    const value = options[index].value;
    if (group === 'start') {
      this._workingIn = value;
    } else {
      this._workingOut = value;
    }
    this._inputRef?.fillGroup(group, value);
    this._popup.show();
    this.updateComplete.then(() => this.listRefFor(group)?.scrollToSelectedValue?.());
  }

  private closePillsDropdown() {
    const pills = this.querySelector('gui-pills') as
      | (HTMLElement & { closeDropdown?: () => void })
      | null;
    pills?.closeDropdown?.();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-time-picker': GuiRangeTimePicker;
  }
}

safeDefine('gui-range-time-picker', GuiRangeTimePicker);
