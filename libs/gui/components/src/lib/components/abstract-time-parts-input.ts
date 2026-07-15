import { property } from 'lit/decorators.js';
import {
  AbstractDateTimeInput,
  timeInputPartDescriptors,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './abstract-date-time-input';
import {
  compareISOTimes,
  getDayPeriodLabels,
  getTimeFormatParts,
  resolveHourFormat,
  to24Hour,
  toISOTimeString,
  type HourFormat,
} from '../utils/time';

export const INVALID_MIN_TIME_MESSAGE = 'Invalid time: time is before the minimum allowed time.';
export const INVALID_MAX_TIME_MESSAGE = 'Invalid time: time is after the maximum allowed time.';

/** A parsed time group: the committed ISO string plus any bounds violation. */
export interface ParsedTimeGroup {
  iso: string;
  boundsError: string | null;
}

/**
 * Shared behavior for the segmented **time** inputs (`gui-time` scalar and
 * `gui-range-time` two-group range). Sits between {@link AbstractDateTimeInput}
 * and those widgets: the base owns the part model/keyboard/rendering, this layer
 * owns everything time-specific — 12/24h resolution, the memoized descriptor and
 * day-period caches, the AM/PM display mapping, day-period seeding, and the
 * single copy of the clamp → write-back → min/max-bounds pipeline. Each subclass
 * only supplies its value type and its `commitParts` policy (scalar emit vs pill
 * accumulation), so the clamp/parse logic can no longer diverge between them.
 */
export abstract class AbstractTimePartsInput extends AbstractDateTimeInput {
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
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
    return getTimeFormatParts(this.localeId, this.effectiveHourFormat);
  }

  protected override getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    const minuteStep = this.minuteStep || 1;
    const key = `${this.localeId ?? ''}|${this.effectiveHourFormat}|${minuteStep}`;
    if (this._descriptorsCache?.key !== key) {
      this._descriptorsCache = {
        key,
        descriptors: timeInputPartDescriptors(
          this.effectiveHourFormat,
          minuteStep,
          this.dayPeriodLabels.am,
        ),
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
   * toggle is a switch that always has a state, so an empty/cleared group must
   * still read "AM" rather than a blank button.
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
   * The single clamp → write-back → bounds pipeline shared by both time widgets.
   * Clamps each numeric part to its descriptor and writes the corrected value
   * back (so the user sees the fix immediately), then — once the group is
   * complete — builds the ISO time and checks it against min/max. Returns null
   * while the group is still incomplete; otherwise the ISO time plus the first
   * bounds violation (or null). This does **not** emit any events — the caller
   * decides how to surface a bounds error (scalar change+inputError vs pill
   * inputError) so the two policies stay in their subclasses.
   */
  protected parseTimeGroup(group: string): ParsedTimeGroup | null {
    const is12h = this.effectiveHourFormat === '12';
    let hourVal = parseInt(this.getPartValue(group, 'hour'), 10);
    let minuteVal = parseInt(this.getPartValue(group, 'minute'), 10);
    const period = this.getPartValue(group, 'dayPeriod');

    // Clamp before the completeness check so an out-of-range part is corrected
    // (e.g. 15 -> 12 in a 12h locale) even if the other part is still empty.
    if (!isNaN(hourVal)) hourVal = this.clampAndWriteBack(group, 'hour', hourVal);
    if (!isNaN(minuteVal)) minuteVal = this.clampAndWriteBack(group, 'minute', minuteVal);

    if (isNaN(hourVal) || isNaN(minuteVal)) return null;
    if (is12h && period !== 'am' && period !== 'pm') return null;

    const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
    const iso = toISOTimeString(new Date(1970, 0, 1, hour24, minuteVal, 0));
    return { iso, boundsError: this.validateTimeBounds(iso) };
  }

  private clampAndWriteBack(group: string, type: DateTimePartType, value: number): number {
    const clamped = this.clampToDescriptor(type, value);
    if (clamped !== value) {
      this.setPartValue(group, type, clamped.toString().padStart(2, '0'));
    }
    return clamped;
  }

  /**
   * Checks a complete ISO time against the scalar minTime/maxTime bounds.
   * Returns the message for the first violated constraint, or null.
   */
  protected validateTimeBounds(iso: string): string | null {
    if (this.minTime && compareISOTimes(iso, this.minTime) < 0) {
      return this.minTimeMessage ?? INVALID_MIN_TIME_MESSAGE;
    }
    if (this.maxTime && compareISOTimes(iso, this.maxTime) > 0) {
      return this.maxTimeMessage ?? INVALID_MAX_TIME_MESSAGE;
    }
    return null;
  }
}
