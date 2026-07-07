import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DisabledTimeRange } from '@golemui/gui-shared/internals';
import './time-input';
import './time-list';
import type { GuiTimeList } from './time-list';
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

  private _restoringFocus = false;
  private _internalValueChange = false;

  /** The disabled time ranges in effect on the selected day. */
  private get resolvedTimeRanges(): TimeRange[] {
    return this._selectedDate
      ? resolveDisabledTimeRangesForDate(this.disabledTimeRanges, this._selectedDate)
      : [];
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

  private onTimeInputChange(event: CustomEvent) {
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

  private onTimeGridChange(event: CustomEvent) {
    event.stopPropagation();
    this.closeTimeGrid();
    this.commitTime(event.detail.value);
  }

  private onTimeGridKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.closeTimeGrid();
  }

  private onTimeInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !this._timeGridOpen) return;
    if ((event.target as HTMLElement).tagName !== 'INPUT') return;
    this.closeTimeGrid();
  }

  private openTimeGrid = () => {
    if (this.disabled || this.readOnly || !this._selectedDate || this._restoringFocus) return;
    if (this._timeGridOpen) return;

    this._yearSelectorOpen = false;
    this._timeGridOpen = true;

    this.updateComplete.then(() =>
      this.querySelector<GuiTimeList>('gui-time-list')?.scrollToSelectedValue(),
    );
  };

  private closeTimeGrid() {
    if (!this._timeGridOpen) return;

    // Move focus into the time input BEFORE removing the grid, so focusout
    // fires with relatedTarget inside the component (year-grid idiom)
    const part = this.querySelector<HTMLElement>('.gui-calendar__time-input-row input');
    if (part) {
      this._restoringFocus = true;
      part.focus();
      setTimeout(() => {
        this._restoringFocus = false;
      });
    }
    this._timeGridOpen = false;
  }

  protected override toggleYearSelector() {
    this._timeGridOpen = false;
    super.toggleYearSelector();
  }

  protected override renderBelowHeader(offset: number): TemplateResult | typeof nothing {
    if (offset !== 0) return nothing;

    return html`
      <div class="gui-calendar__time-input-row">
        <gui-time
          .uid=${this.uid ? `${this.uid}-time` : undefined}
          .showErrors=${false}
          ?disabled=${this.disabled || !this._selectedDate}
          ?readonly=${this.readOnly || !this.allowCustomTime}
          ?required=${this.required}
          .value=${this._selectedTime}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.resolvedTimeRanges}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .disabledRangeMessage=${this.disabledTimeRangeMessage}
          @change=${this.onTimeInputChange}
          @focus=${this.openTimeGrid}
          @click=${this.openTimeGrid}
          @keydown=${this.onTimeInputKeydown}
        ></gui-time>
      </div>
    `;
  }

  protected override renderPanelBody(offset: number): TemplateResult {
    if (this._timeGridOpen && !this._yearSelectorOpen && offset === 0) {
      return html`
        <gui-time-list
          class="gui-calendar__time-grid"
          .uid=${this.uid ? `${this.uid}-time-grid` : undefined}
          .columns=${4}
          .value=${this._selectedTime}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.resolvedTimeRanges}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          ?readonly=${this.readOnly}
          @change=${this.onTimeGridChange}
          @keydown=${this.onTimeGridKeydown}
        ></gui-time-list>
      `;
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
