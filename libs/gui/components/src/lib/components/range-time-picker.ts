import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
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
import { CARET_DOWN_PATH } from '../utils/icons';
import type { TimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatchChange,
  dispatchValue,
  stopPropagation,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message } from '../utils/messages';

/**
 * A time range field with start and end time lists in a popup.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user added, removed or finished editing a range. `detail.value` is the
 *   list of ranges.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @cssprop --gui-calendar-time-grid-height - Height of the time grid.
 * @cssprop --gui-calendar-time-button-height - Height of each time in the grid.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiRangeTimePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the button that opens the popup. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the hour part. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The time ranges, as `{ start, end }` ISO times. */
  @property({ type: Array }) value: TimeRange[] | undefined = [];
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Accessible name of the remove button of each range pill. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start time field. */
  @property({ type: String, attribute: 'start-time-aria-label' }) startTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end time field. */
  @property({ type: String, attribute: 'end-time-aria-label' }) endTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Label of the start time. */
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  /** Label of the end time. */
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  /** Earliest selectable time, as an ISO time (`HH:mm`). */
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  /** Latest selectable time, as an ISO time (`HH:mm`). */
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  /** Times that cannot be picked, as `{ start, end }` ISO time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  /** Allows typing any time, not only picking one from the list. */
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  /** Height of each time list, in pixels. */
  @property({ type: Number }) height: number | undefined = undefined;
  /** Height of each time in the lists, in pixels. */
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  /** Error for a time before `minTime`. */
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  /** Error for a time after `maxTime`. */
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  /** Error when the end time is not after the start time. */
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
    | undefined = undefined;
  /** Error for a time inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  /** Text shown when no time can be picked. */
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  /** Error when focus leaves a partly filled value. */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /** Lets the user edit a range in place from its pill. */
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  /** Tooltip of the edit button of a range pill. */
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  /** Hint that a range pill can be edited. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  /** Tooltip of the confirm button of a range being edited. */
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  /** Tooltip of the cancel button of a range being edited. */
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  /** Announcement when editing a range starts. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  /** Announcement when an edited range is saved. `{label}` is the new range. */
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  /** Announcement when editing a range is cancelled. */
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;

  @query('#time-input') private _inputRef?: GuiRangeTimeInput;

  @state() private _workingIn: string | undefined = undefined;
  @state() private _workingOut: string | undefined = undefined;
  /**
   * Mirror of the embedded input's edit session, fed by its non-bubbling
   * `gui-edit-state-change`: while a session is open, list picks reshape the
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
      this.dispatchEvent(new CustomEvent('gui-blur'));
    },
  });

  // The pills dropdown and the list panel are mutually exclusive.
  /** @internal */
  onDropdownToggle = (event: Event) => {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this._popup.open) this._popup.close();
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('gui-dropdown-toggle', this.onDropdownToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('gui-dropdown-toggle', this.onDropdownToggle);
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
    const startLabel = message('startTime', this.startTimeLabel);
    const endLabel = message('endTime', this.endTimeLabel);

    const panel = this._popup.open
      ? html`<div
          class="gui-picker__panel gui-range-time-picker__panel"
          id=${`${this.uid}_popup`}
          role="dialog"
          aria-label=${message('timeList', this.label)}
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
                @gui-input=${stopPropagation}
                @gui-change=${this.onInListChange}
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
                @gui-input=${stopPropagation}
                @gui-change=${this.onOutListChange}
              ></gui-time-list>
            </div>
          </div>
          ${this.showErrors
            ? addErrors(
                this.uid,
                { errors: this.errors, touched: this.touched },
                { variant: 'panel' },
              )
            : nothing}
        </div>`
      : nothing;

    return html`
      ${addLabel(
        this.uid,
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
          .touched=${this.touched}
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
          @gui-blur=${this.onInputBlur}
          @gui-focus=${this._popup.show}
          @gui-input=${this.onRangeInput}
          @gui-change=${this.onRangeChange}
          @gui-parts-change=${this.onPartsChange}
          @gui-range-click=${this.onPillClick}
          @gui-edit-state-change=${this.onEditStateChange}
        ></gui-range-time>
        <button
          type="button"
          class="gui-range-time-picker__arrow"
          aria-label=${message('showTimeList', this.toggleAriaLabel)}
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
            <path d=${CARET_DOWN_PATH}></path>
          </svg>
        </button>

        ${panel}
      </div>

      ${this.showErrors ? addErrors(this.uid, { errors: this.errors, touched: this.touched }) : ''}
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

  private onRangeInput(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value, false);
  }

  /** The input committed a range (a typed Enter, a list pick or a removed pill). */
  private onRangeChange(event: CustomEvent) {
    event.stopPropagation();
    this._workingIn = undefined;
    this._workingOut = undefined;
    dispatchChange(this, this.value ?? null);
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
    this.dispatchEvent(new CustomEvent('gui-blur'));
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
   * values until the input commits them (see {@link onRangeChange}), and for
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
    dispatchValue(this, value ?? null, { commit: committed });
    if (error) {
      this.dispatchEvent(
        new CustomEvent('gui-input-error', {
          detail: { message: error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  protected override validate(): GuiValidity | null {
    const boundsError = this.validateBounds(this.value);
    return boundsError ? { flags: { customError: true }, message: boundsError } : super.validate();
  }

  private validateBounds(value: TimeRange[] | undefined): string | null {
    if (!value || value.length === 0) return null;
    for (const range of value) {
      for (const endpoint of [range.start, range.end]) {
        if (!endpoint) continue;
        if (this.minTime && compareISOTimes(endpoint, this.minTime) < 0) {
          return message('minTime', this.minTimeMessage);
        }
        if (this.maxTime && compareISOTimes(endpoint, this.maxTime) > 0) {
          return message('maxTime', this.maxTimeMessage);
        }
      }
      if (isTimeRangeDisabled(range.start, range.end, this.disabledRanges)) {
        return message('disabledTimeRange', this.disabledRangeMessage);
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

/** The events `gui-range-time-picker` fires, with their types. */
export const GuiRangeTimePickerEvents = {
  ...valueEvents<GuiRangeTimePicker['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-time-picker': GuiRangeTimePicker;
  }
}

safeDefine('gui-range-time-picker', GuiRangeTimePicker);
