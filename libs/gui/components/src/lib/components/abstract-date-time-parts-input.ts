import { property } from 'lit/decorators.js';
import {
  AbstractDateTimeInput,
  INVALID_DATE_MESSAGE,
  dateInputPartDescriptors,
  timeInputPartDescriptors,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './abstract-date-time-input';
import { maxValidDayInMonth } from '../utils/date';
import {
  from24Hour,
  getDateTimeFormatParts,
  getDayPeriodLabels,
  parseISODateTimeString,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  type HourFormat,
} from '../utils/time';

/**
 * A parsed date-time group. `iso` is the built ISO date-time, or `null` when the
 * date is impossible (e.g. Feb 31). `error` is the first validity/bound
 * violation, or `null`.
 */
export interface ParsedDateTimeGroup {
  iso: string | null;
  error: string | null;
}

export abstract class AbstractDateTimePartsInput extends AbstractDateTimeInput {
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  // Intl.DateTimeFormat construction is expensive and these are consulted on
  // every keystroke, so the derived locale data is memoized per input change.
  private _hourFormatCache: { key: string; format: HourFormat } | undefined;
  private _labelsCache: { key: string; labels: { am: string; pm: string } } | undefined;
  private _descriptorsCache:
    | { key: string; descriptors: Partial<Record<DateTimePartType, DateTimePartDescriptor>> }
    | undefined;

  protected get effectiveHourFormat(): HourFormat {
    const key = `${this.localeId ?? ''}|${this.hourFormat ?? ''}`;
    if (this._hourFormatCache?.key !== key) {
      this._hourFormatCache = { key, format: resolveHourFormat(this.localeId, this.hourFormat) };
    }
    return this._hourFormatCache.format;
  }

  protected get dayPeriodLabels(): { am: string; pm: string } {
    const key = this.localeId ?? '';
    if (this._labelsCache?.key !== key) {
      this._labelsCache = { key, labels: getDayPeriodLabels(this.localeId) };
    }
    return this._labelsCache.labels;
  }

  protected override getFormatParts(): Intl.DateTimeFormatPart[] {
    return getDateTimeFormatParts(this.localeId, this.effectiveHourFormat);
  }

  protected override getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    const minuteStep = this.minuteStep || 1;
    const key = `${this.localeId ?? ''}|${this.effectiveHourFormat}|${minuteStep}`;
    if (this._descriptorsCache?.key !== key) {
      this._descriptorsCache = {
        key,
        descriptors: {
          ...dateInputPartDescriptors(),
          ...timeInputPartDescriptors(this.effectiveHourFormat, minuteStep, this.dayPeriodLabels.am),
        },
      };
    }
    return this._descriptorsCache.descriptors[type as DateTimePartType];
  }

  protected override getPartDisplayValue(group: string, type: DateTimePartType): string {
    const value = this.getPartValue(group, type);
    if (type === 'dayPeriod' && (value === 'am' || value === 'pm')) {
      return this.dayPeriodLabels[value];
    }
    return value;
  }

  /**
   * Seeds each group's day-period toggle to 'am' when the format is 12h. The
   * toggle always has a state, so an empty/cleared group must still read "AM"
   * rather than a blank button.
   */
  protected seedDayPeriods(groups: readonly string[]): void {
    if (this.effectiveHourFormat !== '12') return;
    for (const group of groups) {
      if (!this.getPartValue(group, 'dayPeriod')) {
        this.setPartValue(group, 'dayPeriod', 'am');
      }
    }
  }

  /**
   * Seeds a group's day/month/year/hour/minute/dayPeriod parts from an ISO
   * date-time. A null/empty value clears the group back to its seeded day-period.
   */
  protected setGroupDateTime(group: string, isoValue: string | null): void {
    if (!isoValue) {
      this.clearGroup(group);
      this.seedDayPeriods([group]);
      return;
    }

    const date = parseISODateTimeString(isoValue);
    if (isNaN(date.getTime())) return;

    this.setPartValue(group, 'day', date.getDate().toString().padStart(2, '0'));
    this.setPartValue(group, 'month', (date.getMonth() + 1).toString().padStart(2, '0'));
    this.setPartValue(group, 'year', date.getFullYear().toString());

    const hour24 = date.getHours();
    if (this.effectiveHourFormat === '12') {
      const { hour12, period } = from24Hour(hour24);
      this.setPartValue(group, 'hour', hour12.toString().padStart(2, '0'));
      this.setPartValue(group, 'dayPeriod', period);
    } else {
      this.setPartValue(group, 'hour', hour24.toString().padStart(2, '0'));
    }
    this.setPartValue(group, 'minute', date.getMinutes().toString().padStart(2, '0'));
  }

  /**
   * Clamps each numeric part to its descriptor and writes the correction back
   */
  protected parseDateTimeGroup(group: string): ParsedDateTimeGroup | null {
    const is12h = this.effectiveHourFormat === '12';

    const yearVal = this.clampNumericPart(
      group,
      'year',
      parseInt(this.getPartValue(group, 'year'), 10),
    );
    const monthVal = this.clampNumericPart(
      group,
      'month',
      parseInt(this.getPartValue(group, 'month'), 10),
    );
    const dayVal = this.clampNumericPart(group, 'day', parseInt(this.getPartValue(group, 'day'), 10));
    const hourVal = this.clampNumericPart(
      group,
      'hour',
      parseInt(this.getPartValue(group, 'hour'), 10),
    );
    const minuteVal = this.clampNumericPart(
      group,
      'minute',
      parseInt(this.getPartValue(group, 'minute'), 10),
    );
    const period = this.getPartValue(group, 'dayPeriod');

    const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
    const isMonthValid = !isNaN(monthVal) && monthVal > 0;
    const isDayValid = !isNaN(dayVal) && dayVal > 0;
    const isHourValid = !isNaN(hourVal);
    const isMinuteValid = !isNaN(minuteVal);
    const isPeriodValid = !is12h || period === 'am' || period === 'pm';

    if (
      !(isYearValid && isMonthValid && isDayValid && isHourValid && isMinuteValid && isPeriodValid)
    ) {
      return null;
    }

    const maxValidDay = maxValidDayInMonth(monthVal, yearVal);
    if (dayVal > maxValidDay) {
      return { iso: null, error: this.invalidDateMessage ?? INVALID_DATE_MESSAGE };
    }

    const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
    const instant = new Date(yearVal, monthVal - 1, dayVal, hour24, minuteVal, 0);
    const iso = toISODateTimeString(instant);
    return { iso, error: this.boundsError(iso, instant) };
  }

  /**
   * The bound violation for a complete date-time, or null when it is allowed.
   * The bound model is component-specific and so is left to subclasses: a
   * single-value input may constrain the date and time axes independently,
   * while a range input constrains the instant itself.
   */
  protected boundsError(_iso: string, _instant: Date): string | null {
    return null;
  }
}
