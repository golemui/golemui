import { describe, expect, it } from 'vitest';
import {
  INVALID_DATE_MESSAGE,
  INVALID_MAX_TIME_MESSAGE,
  INVALID_MIN_TIME_MESSAGE,
} from './messages';
import {
  clampPart,
  clearGroup,
  dateInputPartDescriptors,
  getPart,
  getTimeLocaleData,
  incrementPartValue,
  isDigitKey,
  parseDateGroup,
  parseDateTimeGroup,
  parseTimeGroup,
  seedDayPeriods,
  setPart,
  shouldPreventPartKeyDown,
  timeBoundsError,
  timeInputPartDescriptors,
  type PartValues,
} from './parts';

/**
 * Characterization tests: these pin the EXACT semantics extracted from
 * abstract-date-time-input.ts, abstract-time-parts-input.ts,
 * abstract-date-time-parts-input.ts and date-input.ts ahead of deleting the
 * abstract layer. All locale-dependent calls pass an explicit localeId
 * (machine locale is es-ES).
 */

const dateDescriptors = dateInputPartDescriptors();
const time12 = timeInputPartDescriptors('12', 1, 'AM');
const time24 = timeInputPartDescriptors('24', 1, 'AM');
const dateTime12 = { ...dateInputPartDescriptors(), ...time12 };
const dateTime24 = { ...dateInputPartDescriptors(), ...time24 };

describe('descriptor factories', () => {
  it('date descriptors match the abstract layer verbatim', () => {
    expect(dateDescriptors.day).toEqual({
      type: 'day',
      kind: 'numeric',
      maxLength: 2,
      min: 1,
      max: 31,
      placeholder: 'dd',
    });
    expect(dateDescriptors.month).toEqual({
      type: 'month',
      kind: 'numeric',
      maxLength: 2,
      min: 1,
      max: 12,
      placeholder: 'mm',
    });
    expect(dateDescriptors.year).toEqual({
      type: 'year',
      kind: 'numeric',
      maxLength: 4,
      min: 1000,
      max: 9999,
      placeholder: 'yyyy',
    });
  });

  it('12h hour spans 1-12 with NO incrementFallback (empty hour increments to 1)', () => {
    expect(time12.hour).toEqual({
      type: 'hour',
      kind: 'numeric',
      maxLength: 2,
      min: 1,
      max: 12,
      placeholder: 'hh',
    });
  });

  it('24h hour spans 0-23 with incrementFallback 0', () => {
    expect(time24.hour).toEqual({
      type: 'hour',
      kind: 'numeric',
      maxLength: 2,
      min: 0,
      max: 23,
      placeholder: 'hh',
      incrementFallback: 0,
    });
  });

  it('minute wraps, steps by minuteStep and falls back to 0', () => {
    expect(timeInputPartDescriptors('24', 15, 'AM').minute).toEqual({
      type: 'minute',
      kind: 'numeric',
      maxLength: 2,
      min: 0,
      max: 59,
      placeholder: 'mm',
      step: 15,
      incrementFallback: 0,
      wrap: true,
    });
  });

  it('dayPeriod placeholder is the provided locale AM label', () => {
    expect(timeInputPartDescriptors('12', 1, 'a. m.').dayPeriod?.placeholder).toBe('a. m.');
    expect(time12.dayPeriod?.kind).toBe('dayPeriod');
  });
});

describe('part model', () => {
  it('getPart returns "" for unset groups and parts', () => {
    expect(getPart({}, 'default', 'day')).toBe('');
    expect(getPart({ default: {} }, 'default', 'day')).toBe('');
    expect(getPart({ default: { day: '15' } }, 'default', 'day')).toBe('15');
  });

  it('setPart returns new state without mutating the input', () => {
    const before: PartValues = { start: { day: '01' }, end: { day: '02' } };
    const after = setPart(before, 'start', 'month', '06');
    expect(after).not.toBe(before);
    expect(getPart(after, 'start', 'month')).toBe('06');
    expect(getPart(after, 'start', 'day')).toBe('01');
    expect(getPart(after, 'end', 'day')).toBe('02');
    expect(before).toEqual({ start: { day: '01' }, end: { day: '02' } });
  });

  it('clearGroup empties one group and preserves the others', () => {
    const before: PartValues = { start: { day: '01' }, end: { day: '02' } };
    const after = clearGroup(before, 'start');
    expect(after['start']).toEqual({});
    expect(after['end']).toEqual({ day: '02' });
    expect(before['start']).toEqual({ day: '01' });
  });

  it('seedDayPeriods seeds "am" into empty groups only, in 12h format', () => {
    const before: PartValues = { start: {}, end: { dayPeriod: 'pm' } };
    const after = seedDayPeriods(before, ['start', 'end'], '12');
    expect(getPart(after, 'start', 'dayPeriod')).toBe('am');
    expect(getPart(after, 'end', 'dayPeriod')).toBe('pm');
  });

  it('seedDayPeriods is an identity no-op in 24h format', () => {
    const before: PartValues = { start: {} };
    expect(seedDayPeriods(before, ['start'], '24')).toBe(before);
  });
});

describe('clampPart', () => {
  it('passes NaN through with no write-back (empty part)', () => {
    const result = clampPart(dateDescriptors.day, NaN);
    expect(Number.isNaN(result.value)).toBe(true);
    expect(result.writeBack).toBeUndefined();
  });

  it('passes through unchanged in-range values with no write-back', () => {
    expect(clampPart(dateDescriptors.day, 15)).toEqual({ value: 15 });
    expect(clampPart(time24.minute, 0)).toEqual({ value: 0 });
  });

  it('clamps 12h hour 15 down to 12 and writes back "12"', () => {
    expect(clampPart(time12.hour, 15)).toEqual({ value: 12, writeBack: '12' });
  });

  it('clamps 24h hour 99 down to 23 and writes back "23"', () => {
    expect(clampPart(time24.hour, 99)).toEqual({ value: 23, writeBack: '23' });
  });

  it('clamps minute 75 down to 59 and writes back "59"', () => {
    expect(clampPart(time24.minute, 75)).toEqual({ value: 59, writeBack: '59' });
  });

  it('clamps day 0 up to the minimum and zero-pads the write-back', () => {
    expect(clampPart(dateDescriptors.day, 0)).toEqual({ value: 1, writeBack: '01' });
  });

  it('clamps a short year up to 1000, padded to the 4-wide maxLength', () => {
    expect(clampPart(dateDescriptors.year, 5)).toEqual({ value: 1000, writeBack: '1000' });
  });

  it('is a no-op without a descriptor', () => {
    expect(clampPart(undefined, 999)).toEqual({ value: 999 });
  });
});

describe('parseDateGroup', () => {
  const options = { descriptors: dateDescriptors };

  it('parses a complete date to its ISO string and local-midnight instant', () => {
    const { result, writeBacks } = parseDateGroup(
      { year: '2026', month: '06', day: '15' },
      options,
    );
    expect(result).toEqual({
      kind: 'valid',
      iso: '2026-06-15',
      instant: new Date(2026, 5, 15),
    });
    expect(writeBacks).toEqual({});
  });

  it('is incomplete while any part is empty', () => {
    expect(parseDateGroup({}, options).result).toEqual({ kind: 'incomplete' });
    expect(parseDateGroup({ year: '2026', month: '02' }, options).result).toEqual({
      kind: 'incomplete',
    });
  });

  it('rejects Feb 31 as invalid with the default message', () => {
    const { result } = parseDateGroup({ year: '2026', month: '02', day: '28' }, options);
    expect(result.kind).toBe('valid');
    const invalid = parseDateGroup({ year: '2026', month: '02', day: '31' }, options);
    expect(invalid.result).toEqual({ kind: 'invalid', message: INVALID_DATE_MESSAGE });
  });

  it('honours the invalidDateMessage override', () => {
    const { result } = parseDateGroup(
      { year: '2026', month: '02', day: '30' },
      { ...options, invalidDateMessage: 'custom' },
    );
    expect(result).toEqual({ kind: 'invalid', message: 'custom' });
  });

  it('accepts Feb 29 on a leap year and rejects it otherwise', () => {
    expect(parseDateGroup({ year: '2024', month: '02', day: '29' }, options).result.kind).toBe(
      'valid',
    );
    expect(parseDateGroup({ year: '2026', month: '02', day: '29' }, options).result.kind).toBe(
      'invalid',
    );
  });

  it('clamps out-of-range parts before validating, recording write-backs', () => {
    const { result, writeBacks } = parseDateGroup(
      { year: '2026', month: '13', day: '40' },
      options,
    );
    expect(writeBacks).toEqual({ month: '12', day: '31' });
    expect(result).toEqual({
      kind: 'valid',
      iso: '2026-12-31',
      instant: new Date(2026, 11, 31),
    });
  });

  it('records a clamp write-back even while the group is still incomplete', () => {
    const { result, writeBacks } = parseDateGroup({ day: '40' }, options);
    expect(result).toEqual({ kind: 'incomplete' });
    expect(writeBacks).toEqual({ day: '31' });
  });
});

describe('parseTimeGroup', () => {
  const opts12 = { hourFormat: '12' as const, descriptors: time12 };
  const opts24 = { hourFormat: '24' as const, descriptors: time24 };

  it('parses a complete 24h group to HH:mm:00', () => {
    const { result, writeBacks } = parseTimeGroup({ hour: '09', minute: '30' }, opts24);
    expect(result).toEqual({
      kind: 'valid',
      iso: '09:30:00',
      instant: new Date(1970, 0, 1, 9, 30, 0),
    });
    expect(writeBacks).toEqual({});
  });

  it('converts 12h with a day period via to24Hour (12am -> 00, 12pm -> 12)', () => {
    expect(parseTimeGroup({ hour: '12', minute: '00', dayPeriod: 'am' }, opts12).result).toEqual({
      kind: 'valid',
      iso: '00:00:00',
      instant: new Date(1970, 0, 1, 0, 0, 0),
    });
    expect(parseTimeGroup({ hour: '12', minute: '05', dayPeriod: 'pm' }, opts12).result).toEqual({
      kind: 'valid',
      iso: '12:05:00',
      instant: new Date(1970, 0, 1, 12, 5, 0),
    });
    expect(parseTimeGroup({ hour: '03', minute: '15', dayPeriod: 'pm' }, opts12).result).toEqual({
      kind: 'valid',
      iso: '15:15:00',
      instant: new Date(1970, 0, 1, 15, 15, 0),
    });
  });

  it('is incomplete while hour or minute is empty', () => {
    expect(parseTimeGroup({ hour: '09' }, opts24).result).toEqual({ kind: 'incomplete' });
    expect(parseTimeGroup({ minute: '30' }, opts24).result).toEqual({ kind: 'incomplete' });
    expect(parseTimeGroup({}, opts24).result).toEqual({ kind: 'incomplete' });
  });

  it('is incomplete in 12h without an am/pm day period', () => {
    expect(parseTimeGroup({ hour: '09', minute: '30' }, opts12).result).toEqual({
      kind: 'incomplete',
    });
    expect(parseTimeGroup({ hour: '09', minute: '30', dayPeriod: 'AM' }, opts12).result).toEqual({
      kind: 'incomplete',
    });
  });

  it('clamps 12h hour 15 to 12 with write-back even while minute is empty', () => {
    const { result, writeBacks } = parseTimeGroup({ hour: '15', dayPeriod: 'am' }, opts12);
    expect(result).toEqual({ kind: 'incomplete' });
    expect(writeBacks).toEqual({ hour: '12' });
  });

  it('clamps minute 75 to 59 with write-back before committing', () => {
    const { result, writeBacks } = parseTimeGroup({ hour: '10', minute: '75' }, opts24);
    expect(writeBacks).toEqual({ minute: '59' });
    expect(result).toMatchObject({ kind: 'valid', iso: '10:59:00' });
  });
});

describe('timeBoundsError', () => {
  it('returns null when inside the bounds (inclusive)', () => {
    expect(timeBoundsError('09:00:00', { minTime: '09:00', maxTime: '17:00' })).toBeNull();
    expect(timeBoundsError('17:00:00', { minTime: '09:00', maxTime: '17:00' })).toBeNull();
    expect(timeBoundsError('12:00:00', {})).toBeNull();
  });

  it('checks the min bound first with the shared default message', () => {
    expect(timeBoundsError('08:59:00', { minTime: '09:00' })).toBe(INVALID_MIN_TIME_MESSAGE);
    expect(timeBoundsError('17:01:00', { maxTime: '17:00' })).toBe(INVALID_MAX_TIME_MESSAGE);
  });

  it('prefers the caller-supplied messages', () => {
    expect(timeBoundsError('08:00:00', { minTime: '09:00', minTimeMessage: 'too early' })).toBe(
      'too early',
    );
    expect(timeBoundsError('18:00:00', { maxTime: '17:00', maxTimeMessage: 'too late' })).toBe(
      'too late',
    );
  });
});

describe('parseDateTimeGroup', () => {
  const opts12 = { hourFormat: '12' as const, descriptors: dateTime12 };
  const opts24 = { hourFormat: '24' as const, descriptors: dateTime24 };

  const full24 = { year: '2026', month: '06', day: '15', hour: '14', minute: '30' };

  it('parses a complete 24h group to YYYY-MM-DDTHH:mm:00 with its instant', () => {
    const { result, writeBacks } = parseDateTimeGroup(full24, opts24);
    expect(result).toEqual({
      kind: 'valid',
      iso: '2026-06-15T14:30:00',
      instant: new Date(2026, 5, 15, 14, 30, 0),
    });
    expect(writeBacks).toEqual({});
  });

  it('parses a 12h group through to24Hour', () => {
    const { result } = parseDateTimeGroup(
      { year: '2026', month: '06', day: '15', hour: '02', minute: '30', dayPeriod: 'pm' },
      opts12,
    );
    expect(result).toMatchObject({ kind: 'valid', iso: '2026-06-15T14:30:00' });
  });

  it('is incomplete while any required part is missing', () => {
    expect(parseDateTimeGroup({ ...full24, minute: '' }, opts24).result).toEqual({
      kind: 'incomplete',
    });
    expect(parseDateTimeGroup({ ...full24, year: '' }, opts24).result).toEqual({
      kind: 'incomplete',
    });
  });

  it('is incomplete in 12h without an am/pm day period', () => {
    expect(parseDateTimeGroup(full24, opts12).result).toEqual({ kind: 'incomplete' });
  });

  it('rejects an impossible date (Feb 31) even with a valid time', () => {
    const { result } = parseDateTimeGroup(
      { year: '2026', month: '02', day: '31', hour: '10', minute: '00' },
      opts24,
    );
    expect(result).toEqual({ kind: 'invalid', message: INVALID_DATE_MESSAGE });
  });

  it('honours the invalidDateMessage override', () => {
    const { result } = parseDateTimeGroup(
      { year: '2026', month: '02', day: '30', hour: '10', minute: '00' },
      { ...opts24, invalidDateMessage: 'nope' },
    );
    expect(result).toEqual({ kind: 'invalid', message: 'nope' });
  });

  it('clamps every numeric part first, recording write-backs', () => {
    const { result, writeBacks } = parseDateTimeGroup(
      { year: '2026', month: '13', day: '40', hour: '99', minute: '75' },
      opts24,
    );
    expect(writeBacks).toEqual({ month: '12', day: '31', hour: '23', minute: '59' });
    expect(result).toMatchObject({ kind: 'valid', iso: '2026-12-31T23:59:00' });
  });
});

describe('incrementPartValue', () => {
  it('wraps minute 59 -> 00 going up and 00 -> 59 going down', () => {
    expect(incrementPartValue(time24.minute, '59', 'up')).toBe('00');
    expect(incrementPartValue(time24.minute, '00', 'down')).toBe('59');
  });

  it('wraps by the minute step (55 + 15 -> 10)', () => {
    const minute = timeInputPartDescriptors('24', 15, 'AM').minute;
    expect(incrementPartValue(minute, '55', 'up')).toBe('10');
    expect(incrementPartValue(minute, '10', 'down')).toBe('55');
  });

  it('uses incrementFallback on an empty part (24h hour -> 00, minute -> 00)', () => {
    expect(incrementPartValue(time24.hour, '', 'up')).toBe('00');
    expect(incrementPartValue(time24.minute, '', 'down')).toBe('00');
  });

  it('falls back to 1 on an empty part without incrementFallback', () => {
    expect(incrementPartValue(time12.hour, '', 'up')).toBe('01');
    expect(incrementPartValue(dateDescriptors.day, '', 'up')).toBe('01');
  });

  it('produces the historical "0001" for an incremented empty year', () => {
    expect(incrementPartValue(dateDescriptors.year, '', 'up')).toBe('0001');
  });

  it('clamps at the edges for non-wrapping parts', () => {
    expect(incrementPartValue(time12.hour, '12', 'up')).toBe('12');
    expect(incrementPartValue(time12.hour, '01', 'down')).toBe('01');
    expect(incrementPartValue(dateDescriptors.day, '31', 'up')).toBe('31');
    expect(incrementPartValue(time24.hour, '23', 'up')).toBe('23');
    expect(incrementPartValue(time24.hour, '00', 'down')).toBe('00');
  });

  it('steps and zero-pads regular values', () => {
    expect(incrementPartValue(dateDescriptors.day, '09', 'up')).toBe('10');
    expect(incrementPartValue(dateDescriptors.day, '10', 'down')).toBe('09');
    expect(incrementPartValue(dateDescriptors.year, '2026', 'up')).toBe('2027');
  });

  it('pads to 2 and steps by 1 without a descriptor', () => {
    expect(incrementPartValue(undefined, '', 'up')).toBe('01');
    expect(incrementPartValue(undefined, '5', 'up')).toBe('06');
  });
});

describe('keyboard helpers', () => {
  it('isDigitKey accepts only single ASCII digits', () => {
    expect(isDigitKey('0')).toBe(true);
    expect(isDigitKey('9')).toBe(true);
    expect(isDigitKey('a')).toBe(false);
    expect(isDigitKey('10')).toBe(false);
    expect(isDigitKey('ArrowUp')).toBe(false);
  });

  it('shouldPreventPartKeyDown allows digits, editing keys and ctrl/meta chords', () => {
    const ev = (key: string, mods: Partial<KeyboardEvent> = {}) => ({
      key,
      ctrlKey: false,
      metaKey: false,
      ...mods,
    });
    expect(shouldPreventPartKeyDown(ev('5'), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('Backspace'), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('Tab'), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('ArrowLeft'), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('Enter'), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('a', { ctrlKey: true }), false)).toBe(false);
    expect(shouldPreventPartKeyDown(ev('c', { metaKey: true }), false)).toBe(false);
  });

  it('shouldPreventPartKeyDown prevents non-digit characters when editable', () => {
    expect(shouldPreventPartKeyDown({ key: 'a', ctrlKey: false, metaKey: false }, false)).toBe(
      true,
    );
    expect(shouldPreventPartKeyDown({ key: '.', ctrlKey: false, metaKey: false }, false)).toBe(
      true,
    );
  });

  it('shouldPreventPartKeyDown never prevents while parts are readonly', () => {
    expect(shouldPreventPartKeyDown({ key: 'a', ctrlKey: false, metaKey: false }, true)).toBe(
      false,
    );
  });
});

describe('getTimeLocaleData', () => {
  it('resolves the hour format from the locale when no override is given', () => {
    expect(getTimeLocaleData('en-US', undefined, 1).effectiveHourFormat).toBe('12');
    expect(getTimeLocaleData('es-ES', undefined, 1).effectiveHourFormat).toBe('24');
  });

  it('honours an explicit hour-format override', () => {
    expect(getTimeLocaleData('en-US', '24', 1).effectiveHourFormat).toBe('24');
    expect(getTimeLocaleData('es-ES', '12', 1).effectiveHourFormat).toBe('12');
  });

  it('exposes the locale day-period labels and uses the AM label as the dayPeriod placeholder', () => {
    const data = getTimeLocaleData('en-US', undefined, 1);
    expect(data.dayPeriodLabels).toEqual({ am: 'AM', pm: 'PM' });
    expect(data.descriptors.dayPeriod?.placeholder).toBe('AM');
  });

  it('builds time-only descriptors by default and merged date+time on request', () => {
    const timeOnly = getTimeLocaleData('en-US', '24', 1);
    expect(timeOnly.descriptors.year).toBeUndefined();
    expect(timeOnly.descriptors.hour?.max).toBe(23);

    const dateTime = getTimeLocaleData('en-US', '24', 1, true);
    expect(dateTime.descriptors.year?.min).toBe(1000);
    expect(dateTime.descriptors.day?.max).toBe(31);
    expect(dateTime.descriptors.hour?.max).toBe(23);
  });

  it('threads the minute step into the minute descriptor, guarding 0 with || 1', () => {
    expect(getTimeLocaleData('en-US', '24', 15).descriptors.minute?.step).toBe(15);
    expect(getTimeLocaleData('en-US', '24', 0).descriptors.minute?.step).toBe(1);
    expect(getTimeLocaleData('en-US', '24', undefined).descriptors.minute?.step).toBe(1);
  });

  it('memoizes per locale/format/step/shape (same object identity on repeat calls)', () => {
    const a = getTimeLocaleData('en-US', '12', 5);
    const b = getTimeLocaleData('en-US', '12', 5);
    expect(b).toBe(a);
    expect(getTimeLocaleData('en-US', '12', 10)).not.toBe(a);
    expect(getTimeLocaleData('en-US', '12', 5, true)).not.toBe(a);
  });
});
