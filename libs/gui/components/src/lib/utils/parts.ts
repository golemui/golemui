import { maxValidDayInMonth, toISODateString } from './date';
import {
  compareISOTimes,
  getDayPeriodLabels,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  toISOTimeString,
  type HourFormat,
} from './time';
import {
  INVALID_DATE_MESSAGE,
  INVALID_MAX_TIME_MESSAGE,
  INVALID_MIN_TIME_MESSAGE,
} from './messages';

/**
 * Pure part model and parse pipelines for the segmented date/time inputs,
 * extracted from `abstract-date-time-input.ts`, `abstract-time-parts-input.ts`,
 * `abstract-date-time-parts-input.ts` and the inline date logic of
 * `date-input.ts`. Everything here is host-free: state goes in, new state (or
 * a result plus write-backs) comes out, and the caller decides how to store it
 * and which events to emit.
 *
 * Divergences reconciled from the twin abstract layers (flagged so behavior
 * stays auditable):
 * - Clamp write-back padding: `AbstractDateTimeInput.clampNumericPart` pads to
 *   `descriptor.maxLength ?? 2` while `AbstractTimePartsInput.clampAndWriteBack`
 *   hardcodes `padStart(2, '0')`. Both coincide for every time part (hour and
 *   minute have maxLength 2); {@link clampPart} uses the maxLength-based rule,
 *   which also reproduces the year's 4-wide padding.
 * - Descriptor caches: the time twin memoized `timeInputPartDescriptors` only,
 *   the date-time twin memoized the merge with `dateInputPartDescriptors`.
 *   {@link getTimeLocaleData} unifies both behind an `includeDateParts` flag.
 * - Bounds: `parseTimeGroup` embedded its bounds check via the separate
 *   `validateTimeBounds` method, while `parseDateTimeGroup` delegated to a
 *   subclass `boundsError` hook. The pure parsers here keep bounds OUT; the
 *   embedded time call is reproduced by composing {@link timeBoundsError}
 *   after a `valid` result.
 * - Date completeness: `date-input.ts` required `String(year).length === 4`,
 *   `month > 0` and `day > 0`; `range-date-input.ts` only rejected NaN parts
 *   and `String(year).length < 4`. Post-clamp these are equivalent (the clamp
 *   forces year into [1000, 9999], month ≥ 1, day ≥ 1); {@link parseDateGroup}
 *   uses the `date-input.ts` formulation.
 */

export type DateTimePartType =
  | 'day'
  | 'month'
  | 'year'
  | 'hour'
  | 'minute'
  | 'second'
  | 'dayPeriod';

export interface DateTimePartDescriptor {
  type: DateTimePartType;
  kind: 'numeric' | 'dayPeriod';
  maxLength: number;
  min: number;
  max: number;
  placeholder: string;
  step?: number;
  incrementFallback?: number;
  wrap?: boolean;
}

/** Descriptor lookup by part type, as consumed by the parse pipelines. */
export type PartDescriptorMap = Partial<Record<DateTimePartType, DateTimePartDescriptor>>;

/** The raw string values of one group's parts, e.g. { day: '15', month: '06' }. */
export type GroupPartValues = Partial<Record<DateTimePartType, string>>;

/** Part values per group, e.g. { default: { day: '15', month: '06' } }. */
export type PartValues = Partial<Record<string, GroupPartValues>>;

/**
 * Descriptors for day/month/year parts as used by the date inputs.
 *
 * The incrementFallback stays 1 (not the year minimum) so incrementing an
 * empty year still produces the historical '0001' intermediate value in
 * widgets that clamp transiently.
 */
export function dateInputPartDescriptors(): PartDescriptorMap {
  return {
    day: { type: 'day', kind: 'numeric', maxLength: 2, min: 1, max: 31, placeholder: 'dd' },
    month: { type: 'month', kind: 'numeric', maxLength: 2, min: 1, max: 12, placeholder: 'mm' },
    year: {
      type: 'year',
      kind: 'numeric',
      maxLength: 4,
      min: 1000, // TODO: Add a prop to set the default minimum year, like 1979 or 2000
      max: 9999,
      placeholder: 'yyyy',
    },
  };
}

/**
 * Descriptors for hour/minute/dayPeriod parts as used by the time inputs.
 *
 * @param {HourFormat} hourFormat - '12' renders 1-12 hours plus a dayPeriod part, '24' renders 0-23.
 * @param {number} minuteStep - ArrowUp/ArrowDown increment for the minute part.
 * @param {string} dayPeriodPlaceholder - Locale label shown when the dayPeriod part is empty.
 * @return {PartDescriptorMap} The hour/minute/dayPeriod descriptors.
 */
export function timeInputPartDescriptors(
  hourFormat: HourFormat,
  minuteStep: number,
  dayPeriodPlaceholder: string,
): PartDescriptorMap {
  return {
    hour:
      hourFormat === '12'
        ? {
            type: 'hour',
            kind: 'numeric',
            maxLength: 2,
            min: 1,
            max: 12,
            placeholder: 'hh',
          }
        : {
            type: 'hour',
            kind: 'numeric',
            maxLength: 2,
            min: 0,
            max: 23,
            placeholder: 'hh',
            incrementFallback: 0,
          },
    minute: {
      type: 'minute',
      kind: 'numeric',
      maxLength: 2,
      min: 0,
      max: 59,
      placeholder: 'mm',
      step: minuteStep,
      incrementFallback: 0,
      wrap: true,
    },
    dayPeriod: {
      type: 'dayPeriod',
      kind: 'dayPeriod',
      maxLength: 8,
      min: 0,
      max: 0,
      placeholder: dayPeriodPlaceholder,
    },
  };
}

// --- Part model (pure state transitions; the input state is never mutated) ---

/**
 * Reads a part's raw string value; '' when the group or part is unset.
 *
 * @param {PartValues} values - The current part state.
 * @param {string} group - The group name (e.g. 'default', 'start').
 * @param {DateTimePartType} type - The part type.
 * @return {string} The stored value or ''.
 */
export function getPart(values: PartValues, group: string, type: DateTimePartType): string {
  return values[group]?.[type] ?? '';
}

/**
 * Returns new state with one part value set. The previous state (and its
 * group objects) are left untouched, matching the copy-on-write updates the
 * abstract base performed for Lit change detection.
 *
 * @param {PartValues} values - The current part state.
 * @param {string} group - The group name.
 * @param {DateTimePartType} type - The part type.
 * @param {string} value - The raw string value to store.
 * @return {PartValues} The new state.
 */
export function setPart(
  values: PartValues,
  group: string,
  type: DateTimePartType,
  value: string,
): PartValues {
  return { ...values, [group]: { ...values[group], [type]: value } };
}

/**
 * Returns new state with a group's parts reset to an empty record.
 *
 * @param {PartValues} values - The current part state.
 * @param {string} group - The group to clear.
 * @return {PartValues} The new state.
 */
export function clearGroup(values: PartValues, group: string): PartValues {
  return { ...values, [group]: {} };
}

/**
 * Seeds each group's day-period toggle to 'am' when the format is 12h. The
 * toggle is a switch that always has a state, so an empty/cleared group must
 * still read "AM" rather than a blank button. A no-op (input state returned
 * as-is) for 24h formats or when every group already has a day period.
 *
 * @param {PartValues} values - The current part state.
 * @param {readonly string[]} groups - The groups to seed.
 * @param {HourFormat} hourFormat - The effective hour format.
 * @return {PartValues} The (possibly new) state.
 */
export function seedDayPeriods(
  values: PartValues,
  groups: readonly string[],
  hourFormat: HourFormat,
): PartValues {
  if (hourFormat !== '12') return values;
  let next = values;
  for (const group of groups) {
    if (!getPart(next, group, 'dayPeriod')) {
      next = setPart(next, group, 'dayPeriod', 'am');
    }
  }
  return next;
}

// --- Clamp pipeline ---

/** The outcome of clamping one numeric part. */
export interface ClampedPart {
  /** The clamped numeric value, or the original NaN for an empty part. */
  value: number;
  /**
   * The zero-padded string to write back into the part, present only when the
   * clamp actually changed the value (padded to the descriptor's maxLength,
   * defaulting to 2) — exactly what `clampNumericPart` wrote to state.
   */
  writeBack?: string;
}

/**
 * Clamps a numeric part to its descriptor bounds without touching any state.
 * Extracted from `AbstractDateTimeInput.clampNumericPart`/`clampToDescriptor`:
 * NaN passes through untouched, a missing descriptor means no clamping, and a
 * correction yields the zero-padded write-back string the abstract stored.
 *
 * @param {DateTimePartDescriptor | undefined} descriptor - The part descriptor.
 * @param {number} raw - The parsed part value (may be NaN).
 * @return {ClampedPart} The clamped value plus an optional write-back string.
 */
export function clampPart(
  descriptor: DateTimePartDescriptor | undefined,
  raw: number,
): ClampedPart {
  if (isNaN(raw)) return { value: raw };
  if (!descriptor) return { value: raw };
  const clamped = Math.max(descriptor.min, Math.min(descriptor.max, raw));
  if (clamped === raw) return { value: raw };
  return {
    value: clamped,
    writeBack: clamped.toString().padStart(descriptor.maxLength ?? 2, '0'),
  };
}

// --- Group parse pipelines ---

/** Corrections a parse produced; the caller writes them back into its state. */
export type GroupWriteBacks = Partial<Record<DateTimePartType, string>>;

/**
 * The outcome of parsing one group:
 * - 'incomplete': at least one required part is empty/unset — nothing to report.
 * - 'invalid': every part is filled but the combination is impossible
 *   (e.g. Feb 31); `message` is the resolved error message.
 * - 'valid': the committed ISO string plus, when a calendar date is involved,
 *   the local-time Date instant it was built from. Bounds are NOT checked
 *   here — callers apply `dateBoundsError`/{@link timeBoundsError}/their own
 *   instant bounds to a 'valid' result, mirroring the abstract layers' split.
 */
export type GroupParseResult =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; iso: string; instant?: Date };

/** A parse outcome plus the clamp corrections produced along the way. */
export interface ParsedGroup {
  result: GroupParseResult;
  /**
   * Write-backs are produced even for an incomplete group: the abstract layers
   * clamped BEFORE the completeness check so an out-of-range part is corrected
   * (e.g. hour 15 -> '12' in a 12h locale) while the other part is still empty.
   */
  writeBacks: GroupWriteBacks;
}

function clampInto(
  parts: GroupPartValues,
  descriptors: PartDescriptorMap,
  type: DateTimePartType,
  writeBacks: GroupWriteBacks,
): number {
  const raw = parseInt(parts[type] ?? '', 10);
  const { value, writeBack } = clampPart(descriptors[type], raw);
  if (writeBack !== undefined) writeBacks[type] = writeBack;
  return value;
}

/**
 * Parses a day/month/year group into an ISO date (YYYY-MM-DD). Faithful port
 * of the inline pipeline of `date-input.ts` (validateAndEmit) and
 * `range-date-input.ts` (validateDateParts): clamp each part to its descriptor
 * (recording write-backs), require a complete 4-digit-year date, reject an
 * impossible day for the month/year, otherwise build the local-midnight Date.
 * Bounds (`dateBoundsError`) stay with the caller.
 *
 * @param {GroupPartValues} parts - The group's raw part values.
 * @param {object} options - Parse configuration.
 * @param {PartDescriptorMap} options.descriptors - Part descriptors (from {@link dateInputPartDescriptors}).
 * @param {string} [options.invalidDateMessage] - Override for the impossible-date message.
 * @return {ParsedGroup} The parse outcome plus write-backs.
 */
export function parseDateGroup(
  parts: GroupPartValues,
  options: { descriptors: PartDescriptorMap; invalidDateMessage?: string },
): ParsedGroup {
  const writeBacks: GroupWriteBacks = {};
  const yearVal = clampInto(parts, options.descriptors, 'year', writeBacks);
  const monthVal = clampInto(parts, options.descriptors, 'month', writeBacks);
  const dayVal = clampInto(parts, options.descriptors, 'day', writeBacks);

  const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
  const isMonthValid = !isNaN(monthVal) && monthVal > 0;
  const isDayValid = !isNaN(dayVal) && dayVal > 0;
  if (!(isYearValid && isMonthValid && isDayValid)) {
    return { result: { kind: 'incomplete' }, writeBacks };
  }

  if (dayVal > maxValidDayInMonth(monthVal, yearVal)) {
    return {
      result: { kind: 'invalid', message: options.invalidDateMessage ?? INVALID_DATE_MESSAGE },
      writeBacks,
    };
  }

  const instant = new Date(yearVal, monthVal - 1, dayVal);
  return { result: { kind: 'valid', iso: toISODateString(instant), instant }, writeBacks };
}

/**
 * Parses an hour/minute/dayPeriod group into an ISO time (HH:mm:00). Faithful
 * port of `AbstractTimePartsInput.parseTimeGroup` minus its embedded
 * `validateTimeBounds` call: clamp hour and minute (recording write-backs even
 * when the group is still incomplete), require both parts plus — in 12h — an
 * am/pm day period, then convert via `to24Hour`. Compose {@link timeBoundsError}
 * on a 'valid' result to reproduce the original's bounds behavior.
 *
 * @param {GroupPartValues} parts - The group's raw part values.
 * @param {object} options - Parse configuration.
 * @param {HourFormat} options.hourFormat - The effective hour format.
 * @param {PartDescriptorMap} options.descriptors - Part descriptors (from {@link timeInputPartDescriptors}).
 * @return {ParsedGroup} The parse outcome plus write-backs. A time group is
 *   never 'invalid': any filled combination resolves to a real time. The
 *   'valid' instant is the 1970-01-01 anchor Date the ISO was built from.
 */
export function parseTimeGroup(
  parts: GroupPartValues,
  options: { hourFormat: HourFormat; descriptors: PartDescriptorMap },
): ParsedGroup {
  const is12h = options.hourFormat === '12';
  const writeBacks: GroupWriteBacks = {};
  const hourVal = clampInto(parts, options.descriptors, 'hour', writeBacks);
  const minuteVal = clampInto(parts, options.descriptors, 'minute', writeBacks);
  const period = parts.dayPeriod ?? '';

  if (isNaN(hourVal) || isNaN(minuteVal)) return { result: { kind: 'incomplete' }, writeBacks };
  if (is12h && period !== 'am' && period !== 'pm') {
    return { result: { kind: 'incomplete' }, writeBacks };
  }

  const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
  const instant = new Date(1970, 0, 1, hour24, minuteVal, 0);
  return { result: { kind: 'valid', iso: toISOTimeString(instant), instant }, writeBacks };
}

/**
 * Parses a full date-time group into an ISO date-time (YYYY-MM-DDTHH:mm:00).
 * Faithful port of `AbstractDateTimePartsInput.parseDateTimeGroup`: clamp all
 * numeric parts (recording write-backs), require a complete group (4-digit
 * year, month/day > 0, hour, minute, and — in 12h — an am/pm day period),
 * reject an impossible day via `maxValidDayInMonth`, then build the local
 * Date. Bounds stay with the caller (the abstract's `boundsError` was a
 * subclass hook defaulting to null).
 *
 * @param {GroupPartValues} parts - The group's raw part values.
 * @param {object} options - Parse configuration.
 * @param {HourFormat} options.hourFormat - The effective hour format.
 * @param {PartDescriptorMap} options.descriptors - Merged date+time descriptors.
 * @param {string} [options.invalidDateMessage] - Override for the impossible-date message.
 * @return {ParsedGroup} The parse outcome plus write-backs.
 */
export function parseDateTimeGroup(
  parts: GroupPartValues,
  options: {
    hourFormat: HourFormat;
    descriptors: PartDescriptorMap;
    invalidDateMessage?: string;
  },
): ParsedGroup {
  const is12h = options.hourFormat === '12';
  const writeBacks: GroupWriteBacks = {};
  const yearVal = clampInto(parts, options.descriptors, 'year', writeBacks);
  const monthVal = clampInto(parts, options.descriptors, 'month', writeBacks);
  const dayVal = clampInto(parts, options.descriptors, 'day', writeBacks);
  const hourVal = clampInto(parts, options.descriptors, 'hour', writeBacks);
  const minuteVal = clampInto(parts, options.descriptors, 'minute', writeBacks);
  const period = parts.dayPeriod ?? '';

  const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
  const isMonthValid = !isNaN(monthVal) && monthVal > 0;
  const isDayValid = !isNaN(dayVal) && dayVal > 0;
  const isHourValid = !isNaN(hourVal);
  const isMinuteValid = !isNaN(minuteVal);
  const isPeriodValid = !is12h || period === 'am' || period === 'pm';

  if (
    !(isYearValid && isMonthValid && isDayValid && isHourValid && isMinuteValid && isPeriodValid)
  ) {
    return { result: { kind: 'incomplete' }, writeBacks };
  }

  if (dayVal > maxValidDayInMonth(monthVal, yearVal)) {
    return {
      result: { kind: 'invalid', message: options.invalidDateMessage ?? INVALID_DATE_MESSAGE },
      writeBacks,
    };
  }

  const hour24 = is12h ? to24Hour(hourVal, period as 'am' | 'pm') : hourVal;
  const instant = new Date(yearVal, monthVal - 1, dayVal, hour24, minuteVal, 0);
  return { result: { kind: 'valid', iso: toISODateTimeString(instant), instant }, writeBacks };
}

/** Bounds configuration for {@link timeBoundsError}. */
export interface TimeBounds {
  minTime?: string;
  maxTime?: string;
  minTimeMessage?: string;
  maxTimeMessage?: string;
}

/**
 * Checks a complete ISO time against min/max time bounds. Faithful port of
 * `AbstractTimePartsInput.validateTimeBounds`: the min bound is checked first,
 * each falling back to the shared default message.
 *
 * @param {string} iso - The ISO time to test.
 * @param {TimeBounds} bounds - The bounds plus optional message overrides.
 * @return {string | null} The message for the first violated constraint, or null.
 */
export function timeBoundsError(iso: string, bounds: TimeBounds): string | null {
  if (bounds.minTime && compareISOTimes(iso, bounds.minTime) < 0) {
    return bounds.minTimeMessage ?? INVALID_MIN_TIME_MESSAGE;
  }
  if (bounds.maxTime && compareISOTimes(iso, bounds.maxTime) > 0) {
    return bounds.maxTimeMessage ?? INVALID_MAX_TIME_MESSAGE;
  }
  return null;
}

// --- Keyboard helpers ---

/** Non-digit keys a part input accepts without preventDefault. */
export const PART_EDITING_KEYS = [
  'Backspace',
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Delete',
  'Enter',
] as const;

/**
 * Whether a key is a single ASCII digit — the only character input a numeric
 * part accepts (and the trigger for auto-advance when the part is filled).
 *
 * @param {string} key - The KeyboardEvent key.
 * @return {boolean} True for '0'..'9'.
 */
export function isDigitKey(key: string): boolean {
  return /^[0-9]$/.test(key);
}

/**
 * Whether a part input's keydown must be preventDefault-ed. Faithful port of
 * `AbstractDateTimeInput.handleKeyDown`: editing/navigation keys, any
 * ctrl/meta chord, and readonly parts pass through; everything else is
 * prevented unless it is a digit.
 *
 * @param {Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>} event - The keydown event (or a subset).
 * @param {boolean} partsReadonly - The widget's effective parts-readonly state.
 * @return {boolean} True when the event should be prevented.
 */
export function shouldPreventPartKeyDown(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>,
  partsReadonly: boolean,
): boolean {
  if (
    (PART_EDITING_KEYS as readonly string[]).includes(event.key) ||
    event.ctrlKey ||
    event.metaKey ||
    partsReadonly
  ) {
    return false;
  }
  return !isDigitKey(event.key);
}

/**
 * The ArrowUp/ArrowDown value for a numeric part. Faithful port of the
 * arithmetic in `AbstractDateTimeInput.handleKeyUp`: an empty part jumps to
 * the descriptor's incrementFallback (default 1), otherwise the value steps by
 * `step` (default 1) and either wraps modulo the descriptor range (minute) or
 * clamps to [min, max]. The result is zero-padded to the descriptor's
 * maxLength (default 2) — so an empty year still increments to '0001'.
 *
 * @param {DateTimePartDescriptor | undefined} descriptor - The part descriptor.
 * @param {string} current - The part's current raw string value.
 * @param {'up' | 'down'} direction - 'up' for ArrowUp, 'down' for ArrowDown.
 * @return {string} The padded next value to store.
 */
export function incrementPartValue(
  descriptor: DateTimePartDescriptor | undefined,
  current: string,
  direction: 'up' | 'down',
): string {
  const step = descriptor?.step ?? 1;
  const fallback = descriptor?.incrementFallback ?? 1;
  const delta = direction === 'up' ? step : -step;
  const parsed = parseInt(current, 10);
  let value: number;
  if (isNaN(parsed)) {
    value = fallback;
  } else {
    value = parsed + delta;
    if (descriptor?.wrap) {
      const range = descriptor.max - descriptor.min + 1;
      value = ((((value - descriptor.min) % range) + range) % range) + descriptor.min;
    } else if (descriptor) {
      value = Math.max(descriptor.min, Math.min(descriptor.max, value));
    }
  }
  return value.toString().padStart(descriptor?.maxLength ?? 2, '0');
}

// --- Locale data memo ---

/** Derived locale data consumed on every keystroke by the time-aware inputs. */
export interface TimeLocaleData {
  effectiveHourFormat: HourFormat;
  dayPeriodLabels: { am: string; pm: string };
  descriptors: PartDescriptorMap;
}

const timeLocaleDataCache = new Map<string, TimeLocaleData>();

/**
 * Resolves and memoizes the locale-derived data of the time-aware inputs:
 * the effective hour format, the day-period labels and the part descriptors
 * (whose dayPeriod placeholder is the locale's AM label). Replaces the twin
 * per-instance `_hourFormatCache`/`_labelsCache`/`_descriptorsCache` blocks of
 * `abstract-time-parts-input.ts` and `abstract-date-time-parts-input.ts` with
 * one module-level memo — Intl.DateTimeFormat construction is expensive and
 * these are consulted on every keystroke. The cache key covers every input,
 * so entries are shared across hosts and bounded by the distinct
 * locale/format/step combinations in use.
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat | undefined} hourFormat - Explicit hour-format override, if any.
 * @param {number | undefined} minuteStep - The minute step; `|| 1` guards the 0
 *   some framework bindings coerce (matching the twins' `this.minuteStep || 1`).
 * @param {boolean} [includeDateParts] - True to merge in the date descriptors
 *   (the date-time twin's behavior); false for time-only descriptors.
 * @return {TimeLocaleData} The memoized locale data.
 */
export function getTimeLocaleData(
  localeId: string | undefined,
  hourFormat: HourFormat | undefined,
  minuteStep: number | undefined,
  includeDateParts = false,
): TimeLocaleData {
  const step = minuteStep || 1;
  const key = `${localeId ?? ''}|${hourFormat ?? ''}|${step}|${includeDateParts ? 'dt' : 't'}`;
  const cached = timeLocaleDataCache.get(key);
  if (cached) return cached;

  const effectiveHourFormat = resolveHourFormat(localeId, hourFormat);
  const dayPeriodLabels = getDayPeriodLabels(localeId);
  const timeDescriptors = timeInputPartDescriptors(effectiveHourFormat, step, dayPeriodLabels.am);
  const descriptors: PartDescriptorMap = includeDateParts
    ? { ...dateInputPartDescriptors(), ...timeDescriptors }
    : timeDescriptors;

  const data: TimeLocaleData = { effectiveHourFormat, dayPeriodLabels, descriptors };
  timeLocaleDataCache.set(key, data);
  return data;
}
