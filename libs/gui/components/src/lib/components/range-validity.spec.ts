// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { GuiValidity } from '../gui-form-control';
import { message } from '../utils/messages';
import './range-calendar';
import './range-date-picker';
import './range-date-time-calendar';
import './range-date-time-input';
import './range-date-time-picker';
import './range-time-input';
import './range-time-picker';

// A range value set from code is validated against the element's bounds and disabled ranges, like
// a range the user enters, so an out-of-bounds value cannot be submitted.
type Validated = HTMLElement & {
  value: unknown;
  required?: boolean;
  updateComplete: Promise<boolean>;
};

const validityOf = (element: Validated): GuiValidity | null =>
  (element as unknown as { validate(): GuiValidity | null }).validate();

const connect = async (tag: string, props: Record<string, unknown>): Promise<Validated> => {
  const element = document.createElement(tag) as Validated;
  Object.assign(element, { label: 'Range', name: 'range', ...props });
  document.body.append(element);
  await element.updateComplete;
  return element;
};

describe('range elements validate their value', () => {
  beforeAll(() => {
    // The pills watch their size and visibility; jsdom has neither observer.
    const Observer = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.stubGlobal('ResizeObserver', Observer);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe.each(['gui-range-date-picker', 'gui-range-calendar'])('%s', (tag) => {
    const bounds = {
      minDate: '2026-10-10',
      maxDate: '2026-10-31',
      disabledRanges: [{ start: '2026-10-20', end: '2026-10-21' }],
      disabledDateRangeMessage: 'Closed',
    };

    it('accepts a value inside the bounds', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-11', end: '2026-10-15' }],
      });
      expect(validityOf(element)).toBeNull();
    });

    it('underflows below minDate', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-01', end: '2026-10-05' }],
      });
      expect(validityOf(element)).toEqual({
        flags: { rangeUnderflow: true },
        message: message('minDate'),
      });
    });

    it('overflows above maxDate', async () => {
      const element = await connect(tag, { ...bounds, value: [{ start: '2026-11-02' }] });
      expect(validityOf(element)?.flags).toEqual({ rangeOverflow: true });
    });

    it('is a custom error over a disabled range', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-18', end: '2026-10-22' }],
      });
      expect(validityOf(element)).toEqual({ flags: { customError: true }, message: 'Closed' });
    });

    it('still checks required', async () => {
      const element = await connect(tag, { ...bounds, required: true, value: [] });
      expect(validityOf(element)?.flags).toEqual({ valueMissing: true });
    });
  });

  describe.each(['gui-range-time', 'gui-range-time-picker'])('%s', (tag) => {
    const bounds = {
      minTime: '09:00',
      maxTime: '18:00',
      disabledRanges: [{ start: '13:00', end: '14:00' }],
      minTimeMessage: 'Too early',
    };

    it('accepts a value inside the bounds', async () => {
      const element = await connect(tag, { ...bounds, value: [{ start: '09:00', end: '12:00' }] });
      expect(validityOf(element)).toBeNull();
    });

    it('underflows below minTime with the element message', async () => {
      const element = await connect(tag, { ...bounds, value: [{ start: '08:00', end: '10:00' }] });
      expect(validityOf(element)).toEqual({
        flags: { rangeUnderflow: true },
        message: 'Too early',
      });
    });

    it('overflows above maxTime', async () => {
      const element = await connect(tag, { ...bounds, value: [{ start: '17:00', end: '19:00' }] });
      expect(validityOf(element)).toEqual({
        flags: { rangeOverflow: true },
        message: message('maxTime'),
      });
    });

    it('is a custom error over a disabled range', async () => {
      const element = await connect(tag, { ...bounds, value: [{ start: '12:00', end: '15:00' }] });
      expect(validityOf(element)).toEqual({
        flags: { customError: true },
        message: message('disabledTimeRange'),
      });
    });
  });

  describe.each([
    'gui-range-date-time',
    'gui-range-date-time-picker',
    'gui-range-date-time-calendar',
  ])('%s', (tag) => {
    const bounds = {
      minDateTime: '2026-10-10T09:00:00',
      maxDateTime: '2026-10-20T18:00:00',
      disabledRanges: [{ start: '2026-10-12T12:00:00', end: '2026-10-12T13:00:00' }],
      disabledRangeMessage: 'Closed',
    };

    it('accepts a value inside the bounds', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-10T09:00:00', end: '2026-10-11T10:00:00' }],
      });
      expect(validityOf(element)).toBeNull();
    });

    it('underflows below minDateTime', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-10T08:00:00', end: '2026-10-11T10:00:00' }],
      });
      expect(validityOf(element)).toEqual({
        flags: { rangeUnderflow: true },
        message: message('minDateTime'),
      });
    });

    it('overflows above maxDateTime', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-19T10:00:00', end: '2026-10-21T10:00:00' }],
      });
      expect(validityOf(element)?.flags).toEqual({ rangeOverflow: true });
    });

    it('is a custom error over a disabled range', async () => {
      const element = await connect(tag, {
        ...bounds,
        value: [{ start: '2026-10-12T10:00:00', end: '2026-10-12T14:00:00' }],
      });
      expect(validityOf(element)).toEqual({ flags: { customError: true }, message: 'Closed' });
    });
  });

  it('gui-range-date-time-calendar checks its day bounds too', async () => {
    const element = await connect('gui-range-date-time-calendar', {
      minDate: '2026-10-12',
      value: [{ start: '2026-10-11T10:00:00', end: '2026-10-13T10:00:00' }],
    });
    expect(validityOf(element)).toEqual({
      flags: { rangeUnderflow: true },
      message: message('minDate'),
    });
  });
});
