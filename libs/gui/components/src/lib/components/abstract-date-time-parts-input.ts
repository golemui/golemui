import { property } from 'lit/decorators.js';
import {
  AbstractDateTimeInput,
  INVALID_DATE_MESSAGE,
  dateInputPartDescriptors,
  timeInputPartDescriptors,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './abstract-date-time-input';
import { dateBoundsError, maxValidDayInMonth, toISODateString } from '../utils/date';
import {
  compareISOTimes,
  from24Hour,
  getDateTimeFormatParts,
  getDayPeriodLabels,
  parseISODateTimeString,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  toISOTimeString,
  type HourFormat,
} from '../utils/time';

export const INVALID_MIN_TIME_MESSAGE = 'Invalid time: time is before the minimum allowed time.';
export const INVALID_MAX_TIME_MESSAGE = 'Invalid time: time is after the maximum allowed time.';

/**
 * A parsed date-time group. `iso` is the built ISO date-time, or `null` when the
 * date is impossible (e.g. Feb 31). `error` is the first bound/validity
 * violation (invalid date, out-of-range date, or out-of-range time), or `null`.
 */
export interface ParsedDateTimeGroup {
  iso: string | null;
  error: string | null;
}

export abstract class AbstractDateTimePartsInput extends AbstractDateTimeInput {
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;

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
    const iso = toISODateTimeString(new Date(yearVal, monthVal - 1, dayVal, hour24, minuteVal, 0));
    const error =
      this.validateDateBounds(yearVal, monthVal, dayVal) ??
      this.validateTimeBounds(hour24, minuteVal);
    return { iso, error };
  }

  /** Checks the date portion against the scalar minDate/maxDate bounds. */
  private validateDateBounds(year: number, month: number, day: number): string | null {
    const iso = toISODateString(new Date(year, month - 1, day));
    return dateBoundsError(iso, this.minDate, this.maxDate, undefined, {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
    });
  }

  /** Checks the time portion against the scalar minTime/maxTime bounds. */
  private validateTimeBounds(hour24: number, minuteVal: number): string | null {
    const time = toISOTimeString(new Date(1970, 0, 1, hour24, minuteVal, 0));
    if (this.minTime && compareISOTimes(time, this.minTime) < 0) {
      return this.minTimeMessage ?? INVALID_MIN_TIME_MESSAGE;
    }
    if (this.maxTime && compareISOTimes(time, this.maxTime) > 0) {
      return this.maxTimeMessage ?? INVALID_MAX_TIME_MESSAGE;
    }
    return null;
  }
}
