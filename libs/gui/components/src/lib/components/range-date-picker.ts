import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange } from '@golemui/gui-shared/internals';
import './range-date-input';
import type { GuiRangeDateInput } from './range-date-input';
import './range-calendar';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { dateBoundsError, rangeSpansDisabledDay } from '../utils/date';
import { addErrors, addIcon, addLabel } from '../utils/templates';
import { DISABLED_DATE_RANGE_MESSAGE } from '../utils/messages';

export class GuiRangeDatePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'select-year-aria-label' }) selectYearAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'year-grid-aria-label' }) yearGridAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'day-format' }) dayFormat:
    | 'numeric'
    | '2-digit'
    | undefined = undefined;
  @property({ type: String, attribute: 'weekday-format' }) weekdayFormat:
    | 'short'
    | 'long'
    | 'narrow'
    | undefined = undefined;
  @property({ type: String, attribute: 'month-format' }) monthFormat:
    | 'numeric'
    | '2-digit'
    | 'long'
    | 'short'
    | 'narrow'
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: DateRange[] | undefined =
    undefined;
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;

  @query('#date-input') private _dateRef?: GuiRangeDateInput;

  @state() private _focusDate: string | undefined = undefined;
  /**
   * The in-progress range, from either half of the widget: days picked in the
   * calendar or endpoints typed into the input. It lives here — the picker
   * stays mounted — so a half-picked span survives closing and reopening the
   * popover, and it is what the calendar and the input each render.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  @state() private _invalidRange: { start: string; end: string } | null = null;

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-range-date input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) =>
      target.closest('.gui-range-date-input__part') || target.closest('gui-range-calendar')
        ? 'open'
        : 'toggle',
    keyToggleMode: 'openClose',
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
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
      this._dateRef?.finalizeOnLeave();
      this.dispatchEvent(new CustomEvent('blur'));
    },
  });

  // Pills dropdown and the calendar are mutually exclusive, opening one closes the other
  onDropdownToggle = (event: Event) => {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this._popup.open) {
      this._popup.close();
    }
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

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
      ? html`<gui-range-calendar
          id=${`${this.uid}_popup`}
          role="dialog"
          aria-label=${this.label ?? 'Calendar'}
          .uid=${this.uid}
          .hint=${this.hint}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
          .focusDate=${this._focusDate}
          .workingStart=${this._workingStart}
          .workingEnd=${this._workingEnd}
          .prevMonthIcon=${this.prevMonthIcon}
          .nextMonthIcon=${this.nextMonthIcon}
          .prevMonthAriaLabel=${this.prevMonthAriaLabel}
          .nextMonthAriaLabel=${this.nextMonthAriaLabel}
          .selectYearAriaLabel=${this.selectYearAriaLabel}
          .yearGridAriaLabel=${this.yearGridAriaLabel}
          .dayFormat=${this.dayFormat}
          .weekdayFormat=${this.weekdayFormat}
          .monthFormat=${this.monthFormat}
          .minDate=${this.minDate}
          .maxDate=${this.maxDate}
          .disabledRanges=${this.disabledRanges}
          .disabledDateRangeMessage=${this.disabledDateRangeMessage}
          .numberOfMonths=${this.numberOfMonths}
          .localeId=${this.localeId}
          .hidePills=${true}
          .invalidRange=${this._invalidRange}
          @blur=${this.onCalendarBlur}
          @change=${this.onCalendarChange}
          @partsChange=${this.onCalendarPartsChange}
          @inputError=${this.onCalendarInputError}
        ></gui-range-calendar>`
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
        @keydown=${this._popup.onAnchorKeyDown}
        @click=${this._popup.onAnchorClick}
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-range-date
          id="date-input"
          .deferFocusLeave=${true}
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .errors=${this.errors}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
          .icon=${this.icon}
          .localeId=${this.localeId}
          .separator=${this.separator}
          .removePillAriaLabel=${this.removePillAriaLabel}
          .startDateAriaLabel=${this.startDateAriaLabel}
          .endDateAriaLabel=${this.endDateAriaLabel}
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .incompleteMessage=${this.incompleteMessage}
          @blur=${this.onDateBlur}
          @focus=${this._popup.show}
          @change=${this.onDateChange}
          @partsChange=${this.onInputPartsChange}
          @pillClick=${this.onPillClick}
        ></gui-range-date>
        <button
          type="button"
          class="gui-range-date-picker__arrow"
          aria-label=${this.toggleAriaLabel ?? 'Show calendar'}
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

        ${calendar}
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

  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    const value = event.detail.value as DateRange[] | undefined;
    for (const range of value ?? []) {
      const error = this.rangeError(range);
      if (error) {
        this.rejectTypedRange(range, error);
        return;
      }
    }
    this.commitValue(value, event.detail.commit !== false);
  }

  /** The message for the first constraint a range violates, or null when valid. */
  private rangeError(range: DateRange): string | null {
    const start = range.start;
    const end = range.end ?? range.start;
    // A disabled day anywhere in the span — not just at the endpoints.
    if (rangeSpansDisabledDay(start, end, this.disabledRanges)) {
      return this.disabledDateRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE;
    }
    // Either endpoint outside the allowed [minDate, maxDate] window.
    const messages = {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
    };
    for (const endpoint of [start, end]) {
      const error = dateBoundsError(endpoint, this.minDate, this.maxDate, undefined, messages);
      if (error) return error;
    }
    return null;
  }

  private rejectTypedRange(range: DateRange, message: string) {
    const start = range.start;
    const end = range.end ?? range.start;
    this._invalidRange = { start, end };
    this.setWorking(undefined, undefined);
    const input = this._dateRef;
    if (!input) return;

    input.value = this.value ?? [];
    input.showRange(start, end);
    input.surfaceHostError(message);
  }

  /**
   * The input's per-part blur stays inside the widget: moving from a segment
   * into the popover is not leaving the control, so it must not be reported
   * as a blur (which the form layer reads as "validate now"). The picker
   * reports blur from its own focus-leave check instead.
   */
  private onDateBlur(event: Event) {
    event.stopPropagation();
  }

  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    this._dateRef?.clearRangeInputs();
    this.commitValue(event.detail.value);
  }

  /**
   * Applies a new working range, repainting only the endpoints that actually
   * changed. Repainting every reported endpoint would wipe half-typed
   * segments the other half of the widget never saw; skipping the unchanged
   * ones also keeps the caret out of the way while the user types.
   */
  private setWorking(start?: string, end?: string, paint = false): void {
    const startChanged = start !== this._workingStart;
    const endChanged = end !== this._workingEnd;
    this._workingStart = start;
    this._workingEnd = end;

    if (!paint) return;
    if (startChanged) this._dateRef?.fillGroup('start', start ?? null);
    if (endChanged) this._dateRef?.fillGroup('end', end ?? null);
  }

  /** Typed endpoints feed the working range; the calendar follows them. */
  private onInputPartsChange(event: CustomEvent<{ start: string | null; end: string | null }>) {
    event.stopPropagation();
    this.setWorking(event.detail.start ?? undefined, event.detail.end ?? undefined);
  }

  /**
   * The calendar's in-progress selection, held here so it survives the
   * popover, and painted into the fields so a picked day reads back as a date
   * — the reverse of typed parts moving the calendar's selection.
   */
  private onCalendarPartsChange(
    event: CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>,
  ) {
    event.stopPropagation();
    const { anchor, start, end } = event.detail;

    if (start || end) {
      this.setWorking(start ?? undefined, end ?? undefined, true);
      return;
    }

    if (anchor) {
      if (!this._workingStart && this._workingEnd === anchor) return;
      this.setWorking(anchor, undefined, true);
      return;
    }

    this.setWorking(undefined, undefined, true);
  }

  private onCalendarInputError(event: CustomEvent) {
    const range = event.detail?.range as { start: string; end: string } | undefined;
    if (!range) return;
    this._invalidRange = range;
    this._dateRef?.showRange(range.start, range.end);
  }

  /**
   * The single funnel every commit passes through — a calendar span, a typed
   * Enter — so the working selection is torn down once, and the calendar
   * (which follows the cleared props) with it. `committed` is false for the
   * input's error-clearing echo, which carries no new pill and must leave a
   * half-entered range alone.
   */
  private commitValue(value: DateRange[] | null | undefined, committed = true) {
    this.value = value ?? undefined;
    this._invalidRange = null;
    if (committed) this.setWorking(undefined, undefined);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Focus leaving the calendar closes the popover, but it is not necessarily
   * leaving the picker (focus often returns to the fields), so the calendar's
   * bubbling blur is stopped here and never reaches the form layer.
   */
  private onCalendarBlur(event: Event) {
    event.stopPropagation();
    this._popup.closeOnFocusLeave();
  }

  private onPillClick(event: CustomEvent) {
    this._focusDate = event.detail.range.start;
    this._popup.show();
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
    'gui-range-date-picker': GuiRangeDatePicker;
  }
}

safeDefine('gui-range-date-picker', GuiRangeDatePicker);
