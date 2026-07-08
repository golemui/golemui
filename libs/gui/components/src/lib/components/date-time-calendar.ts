import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DisabledTimeRange } from '@golemui/gui-shared/internals';
import './time-picker';
import type { GuiTimePicker } from './time-picker';
import { GuiCalendar, type CalendarDay } from './calendar';
import { isDateInVisibleMonths, toISODateString } from '../utils/date';
import {
  parseISODateTimeString,
  resolveDisabledTimeRangesForDate,
  toISOTimeString,
  type HourFormat,
  type TimeRange,
} from '../utils/time';

@customElement('gui-date-time-calendar')
export class GuiDateTimeCalendar extends GuiCalendar {
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-time-ranges' }) disabledTimeRanges:
    | DisabledTimeRange[]
    | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-time-range-message' }) disabledTimeRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;

  @state() private _selectedDate: string | undefined = undefined;
  @state() private _selectedTime: string | undefined = undefined;
  @state() private _timeGridOpen = false;

  private _internalValueChange = false;

  /** The disabled time ranges in effect on the selected day. */
  private get resolvedTimeRanges(): TimeRange[] {
    return this._selectedDate
      ? resolveDisabledTimeRangesForDate(this.disabledTimeRanges, this._selectedDate)
      : [];
  }

  private get timePicker(): GuiTimePicker | null {
    return this.querySelector('gui-time-picker');
  }

  protected override get selectedDateISO(): string | undefined {
    return this._selectedDate;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (!changedProperties.has('value')) return;
    if (this._internalValueChange) {
      this._internalValueChange = false;
      return;
    }

    if (this.value) {
      const date = parseISODateTimeString(this.value);
      if (!isNaN(date.getTime())) {
        this._selectedDate = toISODateString(date);
        this._selectedTime = toISOTimeString(date);
        if (!isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)) {
          this._currentDate = date;
        }
      }
    } else if (this._selectedTime) {
      this._selectedDate = undefined;
      this._selectedTime = undefined;
    }
  }

  private setValueInternal(value: string | undefined) {
    this._internalValueChange = true;
    this.value = value;
  }

  private emitChange(value: string | null) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const isoDate = toISODateString(day.date);
    if (isoDate === this._selectedDate) return;

    this._selectedDate = isoDate;
    this._selectedTime = undefined;

    if (this.value) {
      this.setValueInternal(undefined);
      this.emitChange(null);
    }
  }

  private commitTime(isoTime: string) {
    if (!this._selectedDate) return;

    this._selectedTime = isoTime;
    this.setValueInternal(`${this._selectedDate}T${isoTime}`);
    this.emitChange(this.value as string);
  }

  private onTimePickerChange(event: CustomEvent) {
    event.stopPropagation();

    const time = event.detail.value as string | null;
    if (!time) {
      this._selectedTime = undefined;
      if (this.value) {
        this.setValueInternal(undefined);
        this.emitChange(null);
      }
      return;
    }

    this.commitTime(time);
  }

  private onListToggle(event: CustomEvent<{ open: boolean }>) {
    event.stopPropagation();

    const { open } = event.detail;
    if (open && this.readOnly) {
      this.timePicker?.closeList();
      return;
    }

    this._timeGridOpen = open;
    if (open) this._yearSelectorOpen = false;
  }

  protected override toggleYearSelector() {
    this.timePicker?.closeList();
    super.toggleYearSelector();
  }

  protected override renderBelowHeader(offset: number): TemplateResult | typeof nothing {
    if (offset !== 0) return nothing;

    return html`
      <div class="gui-calendar__time-input-row">
        <gui-time-picker
          class="gui-time-picker gui-field"
          .uid=${this.uid ? `${this.uid}-time` : undefined}
          .showErrors=${false}
          ?required=${this.required}
          ?disabled=${this.disabled || !this._selectedDate}
          ?readonly=${this.readOnly}
          .allowCustomTime=${this.allowCustomTime}
          .value=${this._selectedTime}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.resolvedTimeRanges}
          .columns=${4}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .disabledRangeMessage=${this.disabledTimeRangeMessage}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          @change=${this.onTimePickerChange}
          @listtoggle=${this.onListToggle}
        ></gui-time-picker>
      </div>
    `;
  }

  protected override renderPanelBody(offset: number): TemplateResult {
    // The picker's contained list occupies the panel body space while open
    if (this._timeGridOpen && !this._yearSelectorOpen && offset === 0) {
      return html``;
    }
    return super.renderPanelBody(offset);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time-calendar': GuiDateTimeCalendar;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date-time-calendar')) {
  customElements.define('gui-date-time-calendar', GuiDateTimeCalendar);
}
