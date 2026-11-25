import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import './range-time-input';
import type { GuiRangeTimeInput } from './range-time-input';
import './time-list';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { fieldPanel, GUIPopupController } from '../controllers/popup.controller';
import { completeRange } from '../utils/range-commit';
import { buildTimeOptions, oneStepAfterISOTime, type HourFormat } from '../utils/time';
import { timeRangesValidity } from '../utils/range-validity';
import { addErrors, addIcon, addLabel } from '../utils/templates';
import type { TimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatchBlur,
  dispatchChange,
  dispatchInputError,
  dispatchValue,
  fires,
  stopPropagation,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { requiredName } from '../utils/messages';

type Group = 'start' | 'end';

/**
 * A time range field with start and end time lists in a popup.
 *
 * ```html
 * <gui-range-time-picker label="Opening hours" locale-id="en-US" minute-step="30">
 * </gui-range-time-picker>
 * ```
 *
 * Picking a start begins a new range and empties the end; picking an end completes it, sets the
 * value and closes the popup. Picking only an end changes the end of the range. The end is always
 * after the start: the end list offers only later times.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as a time out of bounds
 *   or an end before the start. `detail.message` is the error; show it through `errors`.
 * @cssprop --gui-calendar-time-grid-height - Height of the time grid.
 * @cssprop --gui-calendar-time-button-height - Height of each time in the grid.
 */
export class GuiRangeTimePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the button that opens the popup. An empty value keeps the default. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the hour part. An empty value keeps the default. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. An empty value keeps the default. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ attribute: 'show-errors', converter: booleanAttribute }) showErrors:
    | boolean
    | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The time range, as `{ start, end }` ISO times. Both ends are set, or the value is empty. */
  @property({ type: Object }) value: TimeRange | undefined = undefined;
  /** Text shown between the start and end of the range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Accessible name of the start time field. An empty value removes it. */
  @property({ type: String, attribute: 'start-time-aria-label' }) startTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end time field. An empty value removes it. */
  @property({ type: String, attribute: 'end-time-aria-label' }) endTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Label of the start time list. An empty value keeps the default. */
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  /** Label of the end time list. An empty value keeps the default. */
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the lists. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  /** Earliest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  /** Latest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  /** Times that cannot be picked, as `{ start, end }` ISO time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  /** Allows typing any time, not only picking one from the lists. */
  @property({ attribute: 'allow-custom-time', converter: booleanAttribute }) allowCustomTime:
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
  /** Error for a range over `disabledRanges`. */
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

  @query('gui-range-time') private _inputRef?: GuiRangeTimeInput;

  /**
   * The unfinished range, from either half of the widget: times picked in the lists or typed into
   * the field. While neither is set, the lists show the value.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  /** Whether the unfinished range is a list pick, which Escape and leaving drop, rather than typed. */
  private _pickInList = false;

  private _popup = new GUIPopupController(this, {
    floating: fieldPanel(this),
    focusRestoreSelector: 'gui-range-time .gui-range-time-input__part',
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
  });

  /**
   * The single point where the picker reports focus leaving the control: an unfinished list pick
   * is dropped and the value shown again, a half-typed range is cleared and reported, and only
   * then does the picker blur, which the form layer reads as "validate now".
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    resolveSyncOnRelatedTarget: true,
    onLeave: () => {
      if (this._pickInList) {
        this.showValue();
      } else {
        this._inputRef?.settleOnFocusLeave();
      }
      dispatchBlur(this);
    },
  });

  /** The value, when both ends are set. */
  private get range(): TimeRange | undefined {
    return completeRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as TimeRange | undefined;
  }

  /** Whether a range is being picked or typed, rather than the value shown. */
  private get working(): boolean {
    return !!this._workingStart || !!this._workingEnd;
  }

  /** The start the lists show: the unfinished range's, or the value's. */
  private get shownStart(): string | undefined {
    return this.working ? this._workingStart : this.range?.start;
  }

  private get shownEnd(): string | undefined {
    return this.working ? this._workingEnd : this.range?.end;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  /**
   * Bounds for the end list: one slot after the start, so the end is always after it. When that
   * spills past the end of the day, an empty (min > max) window shows the "no available times"
   * message.
   */
  private get endListBounds(): { minTime: string | undefined; maxTime: string | undefined } {
    const start = this.shownStart;
    if (!start) return { minTime: this.minTime, maxTime: this.maxTime };
    const floor = oneStepAfterISOTime(start, this.minuteStep);
    if (!floor) return { minTime: '23:59:59', maxTime: '00:00:00' };
    return { minTime: floor, maxTime: this.maxTime };
  }

  /** A range outside `minTime`/`maxTime` or over a disabled range, then bad input, then `required`. */
  protected override validate(): GuiValidity | null {
    const range = this.range;
    // A typed entry the inner field cannot turn into a value, or one it rejected.
    const badInput = this._inputRef?.partsBadInput() ?? null;
    return (
      timeRangesValidity(range ? [range] : [], this) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  override render() {
    const pickerIcon = addIcon('rangeTimePicker', { icon: this.icon });
    const endBounds = this.endListBounds;
    const startLabel = requiredName('startTime', this.startTimeLabel);
    const endLabel = requiredName('endTime', this.endTimeLabel);

    const panel = this._popup.open
      ? html`<div
          class="gui-picker__panel gui-range-time-picker__panel"
          popover="manual"
          id=${`${this.domId}_popup`}
          role="dialog"
          aria-labelledby=${this.label ? `${this.domId}_label` : nothing}
          aria-label=${this.label ? nothing : requiredName('timeList')}
        >
          <div class="gui-range-time-picker__columns">
            <div class="gui-range-time-picker__column">
              <span class="gui-range-time-picker__column-label">${startLabel}</span>
              <gui-time-list
                class="gui-range-time-picker__list"
                .uid=${this.uid}
                .idPrefix=${this.idPrefix}
                .label=${startLabel}
                .value=${this.shownStart}
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
                @gui-change=${this.onStartListChange}
              ></gui-time-list>
            </div>

            <div class="gui-range-time-picker__column">
              <span class="gui-range-time-picker__column-label">${endLabel}</span>
              <gui-time-list
                class="gui-range-time-picker__list"
                .uid=${this.uid}
                .idPrefix=${this.idPrefix}
                .label=${endLabel}
                .value=${this.shownEnd}
                .localeId=${this.localeId}
                .hourFormat=${this.hourFormat}
                .minuteStep=${this.minuteStep}
                .minTime=${endBounds.minTime}
                .maxTime=${endBounds.maxTime}
                .disabledRanges=${this.disabledRanges}
                .height=${this.height}
                .itemHeight=${this.itemHeight}
                .noAvailableTimesMessage=${this.noAvailableTimesMessage}
                ?readonly=${this.readOnly}
                @gui-input=${stopPropagation}
                @gui-change=${this.onEndListChange}
              ></gui-time-list>
            </div>
          </div>
          ${this.showErrors !== false
            ? addErrors(this, { errors: this.errors, touched: this.touched }, { variant: 'panel' })
            : nothing}
        </div>`
      : nothing;

    return html`
      ${addLabel(
        this,
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
          id=${`${this.domId}_time`}
          class=${classMap(pickerIcon.widgetClasses)}
          .uid=${this.uid}
          .idPrefix=${this.idPrefix}
          .hint=${this.hint}
          .showHint=${false}
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
          .startTimeAriaLabel=${this.startTimeAriaLabel}
          .endTimeAriaLabel=${this.endTimeAriaLabel}
          .hourAriaLabel=${this.hourAriaLabel}
          .minuteAriaLabel=${this.minuteAriaLabel}
          .dayPeriodAriaLabel=${this.dayPeriodAriaLabel}
          @gui-blur=${this.onInputBlur}
          @gui-focus=${stopPropagation}
          @gui-input=${this.onRangeInput}
          @gui-change=${this.onRangeChange}
          @gui-input-error=${this.onInputError}
          @gui-parts-change=${this.onPartsChange}
        ></gui-range-time>
        <button
          type="button"
          class="gui-range-time-picker__arrow"
          aria-label=${requiredName('showTimeList', this.toggleAriaLabel)}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.domId}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <span class="gui-caret" aria-hidden="true"></span>
        </button>

        ${panel}
      </div>

      ${this.showErrors !== false
        ? addErrors(this, { errors: this.errors, touched: this.touched })
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

  /** The field set a range, or cleared it. */
  private onRangeInput(event: CustomEvent) {
    event.stopPropagation();
    const range = completeRange(event.detail.value);
    this.value = range;
    dispatchValue(this, range ?? null, { commit: false });
  }

  /** The field committed a range: the unfinished one is done. */
  private onRangeChange(event: CustomEvent) {
    event.stopPropagation();
    this.setWorking(undefined, undefined);
    dispatchChange(this, this.range ?? null);
  }

  /**
   * Typed times feed the unfinished range, so the lists follow them. The field re-reads its parts
   * on blur too: only times that differ from a list pick are typing.
   */
  private onPartsChange(event: CustomEvent<{ start: string | null; end: string | null }>) {
    event.stopPropagation();
    const start = event.detail.start ?? undefined;
    const end = event.detail.end ?? undefined;
    if (start !== this._workingStart || end !== this._workingEnd) this._pickInList = false;
    this.setWorking(start, end);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  /**
   * The field's per-part blur stays inside the widget: moving from a segment into the panel is not
   * leaving the control, so it must not be reported as a blur (which the form layer reads as
   * "validate now"). The picker reports blur from its own focus-leave check instead.
   */
  private onInputBlur(event: Event) {
    event.stopPropagation();
  }

  /** The field's error is reported as the picker's own. */
  private onInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  private setWorking(start: string | undefined, end: string | undefined): void {
    this._workingStart = start;
    this._workingEnd = end;
    if (!start && !end) this._pickInList = false;
  }

  /** Drops the unfinished range and shows the value in the field again. */
  private showValue(): void {
    this.setWorking(undefined, undefined);
    this._inputRef?.fillGroup('start', this.range?.start ?? null);
    this._inputRef?.fillGroup('end', this.range?.end ?? null);
  }

  /** A start picked: a new range begins, with the end empty. */
  private onStartListChange(event: CustomEvent) {
    event.stopPropagation();
    const start = event.detail.value as string | undefined;
    if (!start) return;
    this.setWorking(start, undefined);
    this._pickInList = true;
    this._inputRef?.fillGroup('start', start);
    this._inputRef?.fillGroup('end', null);
  }

  /** An end picked: with a start, picked or the value's, the range is complete. */
  private onEndListChange(event: CustomEvent) {
    event.stopPropagation();
    const end = event.detail.value as string | undefined;
    if (!end) return;
    const start = this._workingStart ?? this.range?.start;
    this._inputRef?.fillGroup('end', end);
    if (!start) {
      this.setWorking(undefined, end);
      this._pickInList = true;
      return;
    }
    this._inputRef?.fillGroup('start', start);
    this.commitWorkingRange();
  }

  /**
   * Sets the value from the two picked times and closes the popup, returning focus to the field.
   * A range the field rejects (out of bounds or over a disabled range) keeps both times on show
   * with its error, and the value stays.
   */
  private commitWorkingRange(): void {
    this._inputRef?.commitFromParts();
    this.setWorking(undefined, undefined);
    this._popup.restoreFocusToInput();
    this._popup.close();
  }

  /**
   * Escape layering: an unfinished list pick is dropped first, then an open panel closes. Without
   * custom times, the arrows step a time through its list and Enter commits, as in a select.
   */
  private onWidgetKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this._pickInList && this.working) {
      e.preventDefault();
      e.stopPropagation();
      this.showValue();
      return;
    }
    if (this._popup.onAnchorKeyDown(e)) return;
    this.onSelectLikeKeyDown(e);
  };

  private onSelectLikeKeyDown(e: KeyboardEvent): boolean {
    if (this.allowCustomTime || this.readOnly || this.disabled) return false;

    const target = e.target as HTMLElement;
    const group = target.closest('[data-group]')?.getAttribute('data-group');
    if (group !== 'start' && group !== 'end') return false;

    if (e.key === 'Enter') {
      if (this._inputRef?.commitFromParts()) this.setWorking(undefined, undefined);
      return true;
    }

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return false;
    e.preventDefault();
    this.stepEndpoint(group, e.key === 'ArrowDown' ? 1 : -1);
    return true;
  }

  /** Moves one time to the adjacent enabled slot of its list. */
  private stepEndpoint(group: Group, direction: 1 | -1) {
    const bounds =
      group === 'start' ? { minTime: this.minTime, maxTime: this.maxTime } : this.endListBounds;
    const options = buildTimeOptions({
      minTime: bounds.minTime,
      maxTime: bounds.maxTime,
      minuteStep: this.minuteStep,
      disabledRanges: this.disabledRanges,
    });
    if (!options.length) return;

    const current = group === 'start' ? this.shownStart : this.shownEnd;
    const currentIndex = options.findIndex((option) => option.value === current);
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : options.length - 1) : currentIndex + direction;
    while (index >= 0 && index < options.length && options[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= options.length) return;

    const value = options[index].value;
    const start = group === 'start' ? value : this.shownStart;
    const end = group === 'end' ? value : this.shownEnd;
    this.setWorking(start, end);
    this._pickInList = true;
    this._inputRef?.fillGroup(group, value);
    this._popup.show();
    this.updateComplete.then(() => this.listRefFor(group)?.scrollToSelectedValue?.());
  }

  private listRefFor(group: Group) {
    const column = group === 'start' ? 'first-child' : 'last-child';
    return this.querySelector<HTMLElement & { scrollToSelectedValue?: () => void }>(
      `.gui-range-time-picker__column:${column} gui-time-list`,
    );
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
