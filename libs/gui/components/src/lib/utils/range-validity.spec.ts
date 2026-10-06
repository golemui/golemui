import { describe, expect, it } from 'vitest';
import { message } from './messages';
import { dateRangesValidity, dateTimeRangesValidity, timeRangesValidity } from './range-validity';

describe('dateRangesValidity', () => {
  const bounds = { minDate: '2026-10-10', maxDate: '2026-10-31' };

  it('accepts ranges inside the bounds, and no ranges at all', () => {
    expect(dateRangesValidity([{ start: '2026-10-10', end: '2026-10-31' }], bounds)).toBeNull();
    expect(dateRangesValidity([], bounds)).toBeNull();
    expect(dateRangesValidity(undefined, bounds)).toBeNull();
  });

  it('underflows when an endpoint is before minDate', () => {
    expect(dateRangesValidity([{ start: '2026-10-01', end: '2026-10-12' }], bounds)).toEqual({
      flags: { rangeUnderflow: true },
      message: message('minDate'),
    });
  });

  it('overflows when an endpoint is after maxDate, in any range of the list', () => {
    const ranges = [
      { start: '2026-10-12', end: '2026-10-14' },
      { start: '2026-10-20', end: '2026-11-02' },
    ];
    expect(dateRangesValidity(ranges, bounds)?.flags).toEqual({ rangeOverflow: true });
  });

  it('checks a single-day range by its start', () => {
    expect(dateRangesValidity([{ start: '2026-11-01' }], bounds)?.flags).toEqual({
      rangeOverflow: true,
    });
  });

  it('is a custom error when a span steps over a disabled day', () => {
    const disabledRanges = [{ start: '2026-10-15' }];
    expect(
      dateRangesValidity([{ start: '2026-10-14', end: '2026-10-16' }], { disabledRanges }),
    ).toEqual({ flags: { customError: true }, message: message('disabledDateRange') });
  });

  it('uses the element messages', () => {
    const custom = {
      ...bounds,
      disabledRanges: [{ start: '2026-10-15' }],
      minDateMessage: 'Too early',
      maxDateMessage: 'Too late',
      disabledDateRangeMessage: 'Closed',
    };
    expect(dateRangesValidity([{ start: '2026-10-01' }], custom)?.message).toBe('Too early');
    expect(dateRangesValidity([{ start: '2026-11-01' }], custom)?.message).toBe('Too late');
    expect(dateRangesValidity([{ start: '2026-10-15' }], custom)?.message).toBe('Closed');
  });
});

describe('timeRangesValidity', () => {
  const bounds = { minTime: '09:00', maxTime: '18:00:00' };

  it('accepts ranges inside the bounds, whatever the time precision', () => {
    expect(timeRangesValidity([{ start: '09:00:00', end: '18:00' }], bounds)).toBeNull();
  });

  it('underflows and overflows on the endpoints', () => {
    expect(timeRangesValidity([{ start: '08:30', end: '10:00' }], bounds)).toEqual({
      flags: { rangeUnderflow: true },
      message: message('minTime'),
    });
    expect(timeRangesValidity([{ start: '17:00', end: '18:30' }], bounds)).toEqual({
      flags: { rangeOverflow: true },
      message: message('maxTime'),
    });
  });

  it('is a custom error when a range straddles a disabled range', () => {
    const disabledRanges = [{ start: '13:00', end: '14:00' }];
    expect(
      timeRangesValidity([{ start: '12:00', end: '15:00' }], {
        disabledRanges,
        disabledRangeMessage: 'Lunch',
      }),
    ).toEqual({ flags: { customError: true }, message: 'Lunch' });
  });
});

describe('dateTimeRangesValidity', () => {
  const bounds = { minDateTime: '2026-10-10T09:00:00', maxDateTime: '2026-10-20T18:00:00' };

  it('accepts ranges inside the bounds', () => {
    expect(
      dateTimeRangesValidity(
        [{ start: '2026-10-10T09:00:00', end: '2026-10-20T18:00:00' }],
        bounds,
      ),
    ).toBeNull();
  });

  it('underflows and overflows on the instants', () => {
    expect(
      dateTimeRangesValidity([{ start: '2026-10-10T08:59:00', end: '2026-10-11T10:00:00' }], {
        ...bounds,
        minDateTimeMessage: 'Too early',
      }),
    ).toEqual({ flags: { rangeUnderflow: true }, message: 'Too early' });
    expect(
      dateTimeRangesValidity(
        [{ start: '2026-10-19T10:00:00', end: '2026-10-20T18:30:00' }],
        bounds,
      ),
    ).toEqual({ flags: { rangeOverflow: true }, message: message('maxDateTime') });
  });

  it('checks the day bounds of the elements that have them', () => {
    expect(
      dateTimeRangesValidity([{ start: '2026-10-11T10:00:00', end: '2026-10-12T10:00:00' }], {
        ...bounds,
        minDate: '2026-10-12',
      }),
    ).toEqual({ flags: { rangeUnderflow: true }, message: message('minDate') });
  });

  it('is a custom error when a range overlaps a disabled span', () => {
    const disabledRanges = [{ start: '2026-10-12T12:00:00', end: '2026-10-12T13:00:00' }];
    expect(
      dateTimeRangesValidity([{ start: '2026-10-12T10:00:00', end: '2026-10-12T14:00:00' }], {
        disabledRanges,
      }),
    ).toEqual({ flags: { customError: true }, message: message('disabledDateRange') });
  });
});
