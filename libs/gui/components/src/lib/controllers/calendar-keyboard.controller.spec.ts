// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMonthsClamped } from './calendar-keyboard.controller';
import { toISODateString } from '../utils/date';
import '../components/calendar';
import '../components/range-calendar';
import '../components/date-time-calendar';
import '../components/range-date-time-calendar';

type CalendarElement = HTMLElement & { updateComplete: Promise<boolean> };

// "Today" is a Wednesday, so the calendars open on January 2026 without a value.
const TODAY = new Date(2026, 0, 14, 12);

const mount = async (tag: string, props: Record<string, unknown> = {}) => {
  const element = document.createElement(tag) as CalendarElement;
  Object.assign(element, { uid: 'cal', ...props });
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const day = (element: HTMLElement, iso: string) =>
  element.querySelector<HTMLButtonElement>(
    `.gui-calendar__day-button:not(.other-month)[data-date="${iso}"]`,
  );

const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset?.['date'];

/** Focuses a day, presses a key on it and waits for the (async) handler to settle. */
const press = async (
  element: CalendarElement,
  iso: string,
  key: string,
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> => {
  const button = day(element, iso);
  if (!button) throw new Error(`${iso} is not rendered`);
  button.focus();
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  button.dispatchEvent(event);
  await element.updateComplete;
  await new Promise((resolve) => setTimeout(resolve));
  await element.updateComplete;
  return event;
};

/** The month (`YYYY-MM`) of each rendered panel. */
const renderedMonths = (element: HTMLElement) =>
  Array.from(element.querySelectorAll('.gui-calendar__panel')).map((panel) =>
    panel
      .querySelector<HTMLElement>('.gui-calendar__day-button:not(.other-month)')
      ?.dataset['date']?.slice(0, 7),
  );

describe('addMonthsClamped', () => {
  it.each([
    ['2026-01-15', 1, '2026-02-15'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2024-02-29', -12, '2023-02-28'],
    ['2024-01-31', 1, '2024-02-29'],
    ['2026-12-31', 1, '2027-01-31'],
    ['2026-01-10', -1, '2025-12-10'],
  ])('%s %+d months is %s', (from, months, expected) => {
    const [y, m, d] = from.split('-').map(Number);
    expect(toISODateString(addMonthsClamped(new Date(y, m - 1, d), months))).toBe(expected);
  });
});

describe('calendar day grid keys', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('Page Up / Page Down', () => {
    it('moves to the same day of the next month, navigating, without selecting', async () => {
      const element = await mount('gui-calendar', { value: '2026-01-15' });
      const event = await press(element, '2026-01-15', 'PageDown');
      expect(event.defaultPrevented).toBe(true);
      expect(focusedDate()).toBe('2026-02-15');
      expect(renderedMonths(element)).toEqual(['2026-02']);
      expect((element as unknown as { value: string }).value).toBe('2026-01-15');
    });

    it('moves to the same day of the previous month', async () => {
      const element = await mount('gui-calendar', { value: '2026-01-15' });
      await press(element, '2026-01-20', 'PageUp');
      expect(focusedDate()).toBe('2025-12-20');
    });

    it("clamps to the month's last day", async () => {
      const element = await mount('gui-calendar', { value: '2026-03-31' });
      await press(element, '2026-03-31', 'PageUp');
      expect(focusedDate()).toBe('2026-02-28');
      await press(element, '2026-02-28', 'PageDown');
      expect(focusedDate()).toBe('2026-03-28');
    });

    it('moves by a year with Shift', async () => {
      const element = await mount('gui-calendar', { value: '2024-02-29' });
      await press(element, '2024-02-29', 'PageUp', { shiftKey: true });
      expect(focusedDate()).toBe('2023-02-28');
      expect(renderedMonths(element)).toEqual(['2023-02']);
      await press(element, '2023-02-28', 'PageDown', { shiftKey: true });
      expect(focusedDate()).toBe('2024-02-28');
      expect(renderedMonths(element)).toEqual(['2024-02']);
    });

    it('leaves Ctrl/Alt/Meta + Page Up/Down to the browser', async () => {
      const element = await mount('gui-calendar');
      const event = await press(element, '2026-01-14', 'PageDown', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
      expect(focusedDate()).toBe('2026-01-14');
      expect(renderedMonths(element)).toEqual(['2026-01']);
    });

    it('walks past a disabled target in the direction of the move', async () => {
      const element = await mount('gui-calendar', {
        disabledRanges: [{ start: '2026-02-10', end: '2026-02-12' }],
      });
      await press(element, '2026-01-11', 'PageDown');
      expect(focusedDate()).toBe('2026-02-13');
    });

    it('lands on minDate when the target day is before it', async () => {
      const element = await mount('gui-calendar', { minDate: '2026-01-10', value: '2026-02-05' });
      await press(element, '2026-02-05', 'PageUp');
      expect(focusedDate()).toBe('2026-01-10');
    });

    it('lands on maxDate when the target day is after it', async () => {
      const element = await mount('gui-calendar', { maxDate: '2026-02-20' });
      await press(element, '2026-01-25', 'PageDown');
      expect(focusedDate()).toBe('2026-02-20');
    });

    it('does not go past the max month: focuses the last enabled day', async () => {
      const element = await mount('gui-calendar', { maxDate: '2026-01-20' });
      await press(element, '2026-01-05', 'PageDown');
      expect(focusedDate()).toBe('2026-01-20');
      expect(renderedMonths(element)).toEqual(['2026-01']);
    });

    it('goes as far as the min month on Shift+Page Up, then focuses the first enabled day', async () => {
      const element = await mount('gui-calendar', { minDate: '2025-11-20' });
      await press(element, '2026-01-14', 'PageUp', { shiftKey: true });
      expect(renderedMonths(element)).toEqual(['2025-11']);
      expect(focusedDate()).toBe('2025-11-20');
    });

    describe('multi-month', () => {
      it('moves into the next panel without navigating', async () => {
        const element = await mount('gui-calendar', { numberOfMonths: 2 });
        await press(element, '2026-01-31', 'PageDown');
        expect(focusedDate()).toBe('2026-02-28');
        expect(renderedMonths(element)).toEqual(['2026-01', '2026-02']);
      });

      it('navigates the fewest months when the target is not rendered', async () => {
        const element = await mount('gui-calendar', { numberOfMonths: 2 });
        await press(element, '2026-02-15', 'PageDown');
        expect(focusedDate()).toBe('2026-03-15');
        expect(renderedMonths(element)).toEqual(['2026-02', '2026-03']);
        await press(element, '2026-03-15', 'PageUp');
        expect(focusedDate()).toBe('2026-02-15');
        expect(renderedMonths(element)).toEqual(['2026-02', '2026-03']);
        await press(element, '2026-02-15', 'PageUp');
        expect(focusedDate()).toBe('2026-01-15');
        expect(renderedMonths(element)).toEqual(['2026-01', '2026-02']);
      });

      it('moves by a year with Shift', async () => {
        const element = await mount('gui-calendar', { numberOfMonths: 2 });
        await press(element, '2026-01-15', 'PageDown', { shiftKey: true });
        expect(focusedDate()).toBe('2027-01-15');
        expect(renderedMonths(element)).toEqual(['2026-12', '2027-01']);
      });
    });
  });

  describe('Home / End', () => {
    it('moves to the first and last day of the week (Sunday-first locale)', async () => {
      const element = await mount('gui-calendar', { localeId: 'en-US' });
      const event = await press(element, '2026-01-14', 'Home');
      expect(event.defaultPrevented).toBe(true);
      expect(focusedDate()).toBe('2026-01-11');
      await press(element, '2026-01-14', 'End');
      expect(focusedDate()).toBe('2026-01-17');
    });

    it("follows the locale's first day of the week", async () => {
      const element = await mount('gui-calendar', { localeId: 'es' });
      await press(element, '2026-01-14', 'Home');
      expect(focusedDate()).toBe('2026-01-12');
      await press(element, '2026-01-14', 'End');
      expect(focusedDate()).toBe('2026-01-18');
    });

    it('stays inside the month on a week that crosses it', async () => {
      const element = await mount('gui-calendar', { localeId: 'en-US' });
      await press(element, '2026-01-02', 'Home');
      expect(focusedDate()).toBe('2026-01-01');
      await press(element, '2026-01-27', 'End');
      expect(focusedDate()).toBe('2026-01-31');
    });

    it('skips disabled days', async () => {
      const element = await mount('gui-calendar', {
        localeId: 'en-US',
        minDate: '2026-01-13',
        maxDate: '2026-01-15',
      });
      await press(element, '2026-01-14', 'Home');
      expect(focusedDate()).toBe('2026-01-13');
      await press(element, '2026-01-14', 'End');
      expect(focusedDate()).toBe('2026-01-15');
    });

    it('keeps the logical week order in RTL', async () => {
      const element = await mount('gui-calendar', { localeId: 'en-US' });
      element.style.direction = 'rtl';
      await press(element, '2026-01-14', 'ArrowRight');
      expect(focusedDate()).toBe('2026-01-13');
      await press(element, '2026-01-14', 'Home');
      expect(focusedDate()).toBe('2026-01-11');
      await press(element, '2026-01-14', 'End');
      expect(focusedDate()).toBe('2026-01-17');
    });
  });

  describe.each(['gui-range-calendar', 'gui-date-time-calendar', 'gui-range-date-time-calendar'])(
    '%s',
    (tag) => {
      it('handles Page Up/Down and Home/End without selecting', async () => {
        const element = await mount(tag, { localeId: 'en-US', numberOfMonths: 2 });
        await press(element, '2026-02-14', 'PageDown');
        expect(focusedDate()).toBe('2026-03-14');
        expect(renderedMonths(element)).toEqual(['2026-02', '2026-03']);
        await press(element, '2026-03-14', 'PageUp', { shiftKey: true });
        expect(focusedDate()).toBe('2025-03-14');
        await press(element, '2025-03-12', 'Home');
        expect(focusedDate()).toBe('2025-03-09');
        await press(element, '2025-03-12', 'End');
        expect(focusedDate()).toBe('2025-03-15');
        expect(element.querySelector('.gui-calendar__day-button.selected')).toBeNull();
      });
    },
  );
});
