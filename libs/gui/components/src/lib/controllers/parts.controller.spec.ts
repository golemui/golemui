// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  GUIPartsController,
  type GUIPartsControllerOptions,
  type GUIPartsHost,
} from './parts.controller';
import {
  dateInputPartDescriptors,
  timeInputPartDescriptors,
  type DateTimePartType,
  type PartDescriptorMap,
} from '../utils/parts';

/**
 * Characterization tests for the part model, keyboard pipeline and segment
 * focus extracted from AbstractDateTimeInput and its subclass twins. jsdom has
 * no requestAnimationFrame, so a manual queue stands in for it (focusFirst's
 * deferral) and is flushed explicitly.
 */

let rafQueue: Map<number, FrameRequestCallback>;
let nextRafId: number;

function flushRaf() {
  const callbacks = [...rafQueue.values()];
  rafQueue.clear();
  callbacks.forEach((cb) => cb(0));
}

function createHost() {
  const controllers: ReactiveController[] = [];
  const el = document.createElement('div') as unknown as GUIPartsHost;
  Object.assign(el, {
    addController: (c: ReactiveController) => controllers.push(c),
    removeController: (c: ReactiveController) => {
      const index = controllers.indexOf(c);
      if (index > -1) controllers.splice(index, 1);
    },
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  } satisfies Partial<ReactiveControllerHost>);
  document.body.appendChild(el);
  return el;
}

/** Anchors an element at a horizontal position for the visual-order sort. */
function placeAt(el: HTMLElement, left: number) {
  el.getBoundingClientRect = () =>
    ({
      left,
      top: 0,
      right: left + 20,
      bottom: 10,
      width: 20,
      height: 10,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Wires an element to the controller the way the part templates bind events. */
function wire(el: HTMLElement, ctrl: GUIPartsController, group: string, type: DateTimePartType) {
  el.addEventListener('keydown', (e) => ctrl.handleKeyDown(e as KeyboardEvent, group, type));
  el.addEventListener('keyup', (e) => ctrl.handleKeyUp(e as KeyboardEvent, group, type));
  el.addEventListener('change', (e) => ctrl.handleChange(e, group, type));
  el.addEventListener('blur', (e) => ctrl.handleBlur(e as FocusEvent, group, type));
}

function keyup(el: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, ...init }));
}

function keydown(el: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init });
  el.dispatchEvent(event);
  return event;
}

interface Setup {
  host: GUIPartsHost;
  ctrl: GUIPartsController;
  commitGroup: ReturnType<typeof vi.fn>;
  onEmptyPartBlur: ReturnType<typeof vi.fn>;
  options: GUIPartsControllerOptions;
}

/**
 * A gui-date-like single-group widget: day/month/year inputs laid out left to
 * right at 0/30/60.
 */
function setupDate(overrides: Partial<GUIPartsControllerOptions> = {}) {
  const host = createHost();
  const descriptors = dateInputPartDescriptors();
  const commitGroup = vi.fn();
  const onEmptyPartBlur = vi.fn();
  const options: GUIPartsControllerOptions = {
    blockClass: 'gui-date-input',
    groups: ['default'],
    getDescriptor: (type) => descriptors[type as DateTimePartType],
    commitGroup,
    isReadonly: () => false,
    isDisabled: () => false,
    onEmptyPartBlur,
    ...overrides,
  };
  const ctrl = new GUIPartsController(host, options);

  const makeInput = (type: DateTimePartType, maxLength: number, left: number) => {
    const input = document.createElement('input');
    input.className = 'gui-parts__part gui-date-input__part';
    input.dataset['type'] = type;
    input.maxLength = maxLength;
    placeAt(input, left);
    wire(input, ctrl, 'default', type);
    host.appendChild(input);
    return input;
  };
  const day = makeInput('day', 2, 0);
  const month = makeInput('month', 2, 30);
  const year = makeInput('year', 4, 60);

  return { host, ctrl, commitGroup, onEmptyPartBlur, options, day, month, year } as Setup & {
    day: HTMLInputElement;
    month: HTMLInputElement;
    year: HTMLInputElement;
  };
}

/**
 * A gui-range-time-like two-group widget: hour/minute (plus a dayPeriod
 * toggle in 12h) per group, all laid out left to right.
 */
function setupRangeTime(
  hourFormat: '12' | '24' = '24',
  overrides: Partial<GUIPartsControllerOptions> = {},
) {
  const host = createHost();
  const descriptors: PartDescriptorMap = timeInputPartDescriptors(hourFormat, 1, 'AM');
  const commitGroup = vi.fn();
  const onEmptyPartBlur = vi.fn();
  const options: GUIPartsControllerOptions = {
    blockClass: 'gui-range-time-input',
    groups: ['start', 'end'],
    getDescriptor: (type) => descriptors[type as DateTimePartType],
    commitGroup,
    isReadonly: () => false,
    isDisabled: () => false,
    onEmptyPartBlur,
    getHourFormat: () => hourFormat,
    ...overrides,
  };
  const ctrl = new GUIPartsController(host, options);

  let left = 0;
  const makePart = (group: string, type: DateTimePartType, tag: 'input' | 'button') => {
    const el = document.createElement(tag);
    el.className = 'gui-parts__part gui-range-time-input__part';
    el.dataset['type'] = type;
    el.dataset['group'] = group;
    if (el instanceof HTMLInputElement) el.maxLength = 2;
    placeAt(el, left);
    left += 30;
    wire(el, ctrl, group, type);
    host.appendChild(el);
    return el;
  };
  const startHour = makePart('start', 'hour', 'input') as HTMLInputElement;
  const startMinute = makePart('start', 'minute', 'input') as HTMLInputElement;
  const startPeriod = hourFormat === '12' ? makePart('start', 'dayPeriod', 'button') : undefined;
  const endHour = makePart('end', 'hour', 'input') as HTMLInputElement;
  const endMinute = makePart('end', 'minute', 'input') as HTMLInputElement;
  const endPeriod = hourFormat === '12' ? makePart('end', 'dayPeriod', 'button') : undefined;

  return {
    host,
    ctrl,
    commitGroup,
    onEmptyPartBlur,
    options,
    startHour,
    startMinute,
    startPeriod,
    endHour,
    endMinute,
    endPeriod,
  };
}

describe('GUIPartsController', () => {
  beforeEach(() => {
    rafQueue = new Map();
    nextRafId = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        nextRafId += 1;
        rafQueue.set(nextRafId, cb);
        return nextRafId;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => {
        rafQueue.delete(id);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('part model', () => {
    it('getPart returns "" for unset groups and parts', () => {
      const { ctrl } = setupDate();
      expect(ctrl.getPart('default', 'day')).toBe('');
    });

    it('setPart stores the value and requests a host update', () => {
      const { ctrl, host } = setupDate();
      ctrl.setPart('default', 'day', '15');
      expect(ctrl.getPart('default', 'day')).toBe('15');
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it('state is copy-on-write: earlier snapshots are never mutated', () => {
      const { ctrl } = setupDate();
      ctrl.setPart('default', 'day', '15');
      const snapshot = ctrl.values;
      ctrl.setPart('default', 'day', '16');
      expect(snapshot['default']?.day).toBe('15');
      expect(ctrl.values['default']?.day).toBe('16');
    });

    it('clearGroup resets the group to an empty record', () => {
      const { ctrl } = setupDate();
      ctrl.setPart('default', 'day', '15');
      ctrl.clearGroup('default');
      expect(ctrl.getPart('default', 'day')).toBe('');
      expect(ctrl.values['default']).toEqual({});
    });

    it('applyWriteBacks writes every correction into the group', () => {
      const { ctrl } = setupDate();
      ctrl.applyWriteBacks('default', { day: '31', month: '12' });
      expect(ctrl.getPart('default', 'day')).toBe('31');
      expect(ctrl.getPart('default', 'month')).toBe('12');
    });
  });

  describe('seedDayPeriods', () => {
    it('seeds "am" into every group lacking a day period in 12h', () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.seedDayPeriods();
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('am');
      expect(ctrl.getPart('end', 'dayPeriod')).toBe('am');
    });

    it('leaves an existing day period untouched', () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setPart('end', 'dayPeriod', 'pm');
      ctrl.seedDayPeriods();
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('am');
      expect(ctrl.getPart('end', 'dayPeriod')).toBe('pm');
    });

    it('is a no-op in 24h and does not request an update', () => {
      const { ctrl, host } = setupRangeTime('24');
      ctrl.seedDayPeriods();
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('');
      expect(host.requestUpdate).not.toHaveBeenCalled();
    });

    it('defaults to 24h (no-op) when getHourFormat is not provided', () => {
      const { ctrl } = setupDate();
      ctrl.seedDayPeriods();
      expect(ctrl.values['default']).toBeUndefined();
    });

    it('does not re-request an update when every group is already seeded', () => {
      const { ctrl, host } = setupRangeTime('12');
      ctrl.seedDayPeriods();
      const calls = (host.requestUpdate as ReturnType<typeof vi.fn>).mock.calls.length;
      ctrl.seedDayPeriods();
      expect(host.requestUpdate).toHaveBeenCalledTimes(calls);
    });
  });

  describe('setGroupFromISO', () => {
    it("shape 'date' seeds day/month/year (date-input.parseValue)", () => {
      const { ctrl } = setupDate();
      ctrl.setGroupFromISO('default', '2024-06-15', 'date');
      expect(ctrl.values['default']).toEqual({ day: '15', month: '06', year: '2024' });
    });

    it("shape 'date' pads the year to 4 digits (writeGroupDate form)", () => {
      const { ctrl } = setupDate();
      ctrl.setGroupFromISO('default', '0999-01-02', 'date');
      expect(ctrl.getPart('default', 'year')).toBe('0999');
    });

    it("shape 'date' with a falsy value clears the group", () => {
      const { ctrl } = setupDate();
      ctrl.setPart('default', 'day', '15');
      ctrl.setGroupFromISO('default', '', 'date');
      expect(ctrl.values['default']).toEqual({});
    });

    it("shape 'date' leaves the state untouched for unparseable input", () => {
      const { ctrl } = setupDate();
      ctrl.setPart('default', 'day', '15');
      ctrl.setGroupFromISO('default', 'nonsense', 'date');
      expect(ctrl.values['default']).toEqual({ day: '15' });
    });

    it("shape 'time' in 24h seeds zero-padded hour and minute", () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.setGroupFromISO('start', '09:30', 'time');
      expect(ctrl.values['start']).toEqual({ hour: '09', minute: '30' });
    });

    it("shape 'time' in 12h splits into hour and day period", () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setGroupFromISO('start', '15:45', 'time');
      expect(ctrl.values['start']).toEqual({ hour: '03', dayPeriod: 'pm', minute: '45' });
    });

    it("shape 'time' takes the time-of-day of a full ISO date-time", () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.setGroupFromISO('start', '2024-06-15T08:05', 'time');
      expect(ctrl.values['start']).toEqual({ hour: '08', minute: '05' });
    });

    it("shape 'time' with a falsy value clears and re-seeds the day period in 12h", () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setGroupFromISO('start', '15:45', 'time');
      ctrl.setGroupFromISO('start', null, 'time');
      expect(ctrl.values['start']).toEqual({ dayPeriod: 'am' });
    });

    it("shape 'time' leaves the state untouched for unparseable input", () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.setPart('start', 'hour', '09');
      ctrl.setGroupFromISO('start', 'nonsense', 'time');
      expect(ctrl.values['start']).toEqual({ hour: '09' });
    });

    it("shape 'dateTime' seeds all parts (setGroupDateTime), 12h splitting the hour", () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setGroupFromISO('start', '2024-06-15T15:45', 'dateTime');
      expect(ctrl.values['start']).toEqual({
        day: '15',
        month: '06',
        year: '2024',
        hour: '03',
        dayPeriod: 'pm',
        minute: '45',
      });
    });

    it("shape 'dateTime' in 24h keeps the 24h hour", () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.setGroupFromISO('start', '2024-06-15T15:45', 'dateTime');
      expect(ctrl.values['start']).toEqual({
        day: '15',
        month: '06',
        year: '2024',
        hour: '15',
        minute: '45',
      });
    });

    it("shape 'dateTime' with a falsy value clears and re-seeds the day period", () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setGroupFromISO('start', '2024-06-15T15:45', 'dateTime');
      ctrl.setGroupFromISO('start', null, 'dateTime');
      expect(ctrl.values['start']).toEqual({ dayPeriod: 'am' });
    });

    it('an explicit hourFormat argument overrides the getHourFormat option', () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.setGroupFromISO('start', '15:45', 'time', '12');
      expect(ctrl.values['start']).toEqual({ hour: '03', dayPeriod: 'pm', minute: '45' });
    });
  });

  describe('getPartDisplay', () => {
    it('returns the raw stored value without a labels accessor (abstract default)', () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.setPart('start', 'dayPeriod', 'am');
      expect(ctrl.getPartDisplay('start', 'dayPeriod')).toBe('am');
    });

    it('maps am/pm to the locale labels when provided (time twins)', () => {
      const { ctrl } = setupRangeTime('12', {
        getDayPeriodLabels: () => ({ am: 'a. m.', pm: 'p. m.' }),
      });
      ctrl.setPart('start', 'dayPeriod', 'pm');
      expect(ctrl.getPartDisplay('start', 'dayPeriod')).toBe('p. m.');
    });

    it('leaves non-dayPeriod parts and unset day periods unmapped', () => {
      const { ctrl } = setupRangeTime('12', {
        getDayPeriodLabels: () => ({ am: 'a. m.', pm: 'p. m.' }),
      });
      ctrl.setPart('start', 'hour', '09');
      expect(ctrl.getPartDisplay('start', 'hour')).toBe('09');
      expect(ctrl.getPartDisplay('start', 'dayPeriod')).toBe('');
    });
  });

  describe('digit gating (handleKeyDown)', () => {
    it('prevents non-digit character keys', () => {
      const { day } = setupDate();
      expect(keydown(day, 'a').defaultPrevented).toBe(true);
      expect(keydown(day, '.').defaultPrevented).toBe(true);
    });

    it('allows digits', () => {
      const { day } = setupDate();
      expect(keydown(day, '5').defaultPrevented).toBe(false);
    });

    it('allows every editing/navigation key', () => {
      const { day } = setupDate();
      for (const key of [
        'Backspace',
        'Tab',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Delete',
        'Enter',
      ]) {
        expect(keydown(day, key).defaultPrevented).toBe(false);
      }
    });

    it('allows ctrl/meta chords', () => {
      const { day } = setupDate();
      expect(keydown(day, 'c', { ctrlKey: true }).defaultPrevented).toBe(false);
      expect(keydown(day, 'v', { metaKey: true }).defaultPrevented).toBe(false);
    });

    it('lets everything through while parts are readonly', () => {
      const { day } = setupDate({ isReadonly: () => true });
      expect(keydown(day, 'a').defaultPrevented).toBe(false);
    });
  });

  describe('auto-advance', () => {
    it('a digit filling a segment focuses the next input of the group', () => {
      const { day, month } = setupDate();
      day.value = '15';
      keyup(day, '5');
      expect(document.activeElement).toBe(month);
    });

    it('does not advance when the segment is not full', () => {
      const { day, month } = setupDate();
      day.focus();
      day.value = '1';
      keyup(day, '1');
      expect(document.activeElement).not.toBe(month);
    });

    it('does not advance on non-digit keys', () => {
      const { day, month } = setupDate();
      day.focus();
      day.value = '15';
      keyup(day, 'Backspace');
      expect(document.activeElement).not.toBe(month);
    });

    it('single group: wraps from the last input to the first (abstract default)', () => {
      const { day, year } = setupDate();
      year.value = '2024';
      keyup(year, '4');
      expect(document.activeElement).toBe(day);
    });

    it('multi group: advances from the end of a group into the next group', () => {
      const { startMinute, endHour } = setupRangeTime('24');
      startMinute.value = '30';
      keyup(startMinute, '0');
      expect(document.activeElement).toBe(endHour);
    });

    it('multi group: has nowhere to advance after the last group', () => {
      const { endMinute } = setupRangeTime('24');
      endMinute.focus();
      endMinute.value = '30';
      keyup(endMinute, '0');
      expect(document.activeElement).toBe(endMinute);
    });

    it('does nothing while parts are readonly', () => {
      const { day, month } = setupDate({ isReadonly: () => true });
      day.focus();
      day.value = '15';
      keyup(day, '5');
      expect(document.activeElement).not.toBe(month);
    });
  });

  describe('arrow increment', () => {
    it('ArrowUp steps the part, re-selects it and commits the group', () => {
      const { ctrl, day, commitGroup } = setupDate();
      const select = vi.spyOn(day, 'select');
      day.value = '05';
      keyup(day, 'ArrowUp');
      expect(ctrl.getPart('default', 'day')).toBe('06');
      expect(select).toHaveBeenCalledTimes(1);
      expect(commitGroup).toHaveBeenCalledWith('default');
    });

    it('ArrowDown clamps at the descriptor minimum (day 01 stays 01)', () => {
      const { ctrl, day } = setupDate();
      day.value = '01';
      keyup(day, 'ArrowDown');
      expect(ctrl.getPart('default', 'day')).toBe('01');
    });

    it('the minute wraps 59 -> 00 on ArrowUp', () => {
      const { ctrl, startMinute } = setupRangeTime('24');
      startMinute.value = '59';
      keyup(startMinute, 'ArrowUp');
      expect(ctrl.getPart('start', 'minute')).toBe('00');
    });

    it('an empty year increments to 0001 (incrementFallback 1, padded to 4)', () => {
      const { ctrl, year } = setupDate();
      year.value = '';
      keyup(year, 'ArrowUp');
      expect(ctrl.getPart('default', 'year')).toBe('0001');
    });

    it('the dayPeriod toggle ignores ArrowUp/ArrowDown (Enter/Space only)', () => {
      const { ctrl, startPeriod, commitGroup } = setupRangeTime('12');
      keyup(startPeriod as HTMLElement, 'ArrowUp');
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('');
      expect(commitGroup).not.toHaveBeenCalled();
    });

    it('Enter forwards to onEnter with the event and group', () => {
      const onEnter = vi.fn();
      const { day } = setupDate({ onEnter });
      keyup(day, 'Enter');
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onEnter.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
      expect(onEnter.mock.calls[0][1]).toBe('default');
    });

    it('Enter is a no-op without an onEnter option (abstract default)', () => {
      const { day, commitGroup } = setupDate();
      expect(() => keyup(day, 'Enter')).not.toThrow();
      expect(commitGroup).not.toHaveBeenCalled();
    });

    it('does nothing while parts are readonly', () => {
      const { ctrl, day, commitGroup } = setupDate({ isReadonly: () => true });
      day.value = '05';
      keyup(day, 'ArrowUp');
      expect(ctrl.getPart('default', 'day')).toBe('');
      expect(commitGroup).not.toHaveBeenCalled();
    });
  });

  describe('visual-order navigation', () => {
    it('ArrowRight moves to the visually next part and selects it', () => {
      const { day, month } = setupDate();
      const select = vi.spyOn(month, 'select');
      keyup(day, 'ArrowRight');
      expect(document.activeElement).toBe(month);
      expect(select).toHaveBeenCalledTimes(1);
    });

    it('ArrowLeft moves to the visually previous part', () => {
      const { day, month } = setupDate();
      keyup(month, 'ArrowLeft');
      expect(document.activeElement).toBe(day);
    });

    it('sorts by getBoundingClientRect().left, not DOM order', () => {
      const { day, month, year } = setupDate();
      // Visually reversed row: year | month | day
      placeAt(day, 60);
      placeAt(month, 30);
      placeAt(year, 0);
      keyup(year, 'ArrowRight');
      expect(document.activeElement).toBe(month);
    });

    it('single group: stops at the visual edges (abstract default)', () => {
      const { day, year } = setupDate();
      day.focus();
      keyup(day, 'ArrowLeft');
      expect(document.activeElement).toBe(day);
      year.focus();
      keyup(year, 'ArrowRight');
      expect(document.activeElement).toBe(year);
    });

    it('multi group LTR: ArrowRight past the start edge enters the end group', () => {
      const { startMinute, endHour } = setupRangeTime('24');
      const select = vi.spyOn(endHour, 'select');
      keyup(startMinute, 'ArrowRight');
      expect(document.activeElement).toBe(endHour);
      expect(select).toHaveBeenCalledTimes(1);
    });

    it('multi group LTR: ArrowLeft past the end edge lands on the last start input', () => {
      const { startMinute, endHour } = setupRangeTime('24');
      keyup(endHour, 'ArrowLeft');
      expect(document.activeElement).toBe(startMinute);
    });

    it('multi group LTR: ArrowRight past the end edge stays put', () => {
      const { endMinute } = setupRangeTime('24');
      endMinute.focus();
      keyup(endMinute, 'ArrowRight');
      expect(document.activeElement).toBe(endMinute);
    });

    it('multi group RTL: ArrowLeft past the start edge lands on the last end input', () => {
      const { startHour, endMinute } = setupRangeTime('24');
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        direction: 'rtl',
      } as CSSStyleDeclaration);
      keyup(startHour, 'ArrowLeft');
      expect(document.activeElement).toBe(endMinute);
    });

    it('multi group RTL: ArrowRight past the end edge lands on the first start input', () => {
      const { startHour, endMinute } = setupRangeTime('24');
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        direction: 'rtl',
      } as CSSStyleDeclaration);
      keyup(endMinute, 'ArrowRight');
      expect(document.activeElement).toBe(startHour);
    });
  });

  describe('handleChange', () => {
    it('strips non-digits, stores the value and commits', () => {
      const { ctrl, day, commitGroup } = setupDate();
      day.value = '1a5';
      day.dispatchEvent(new Event('change'));
      expect(ctrl.getPart('default', 'day')).toBe('15');
      expect(commitGroup).toHaveBeenCalledWith('default');
    });

    it('stops immediate propagation so the native change never escapes', () => {
      const { day } = setupDate();
      const later = vi.fn();
      day.addEventListener('change', later);
      day.value = '15';
      day.dispatchEvent(new Event('change'));
      expect(later).not.toHaveBeenCalled();
    });

    it('ignores dayPeriod parts', () => {
      const { ctrl, startPeriod, commitGroup } = setupRangeTime('12');
      (startPeriod as HTMLElement).dispatchEvent(new Event('change'));
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('');
      expect(commitGroup).not.toHaveBeenCalled();
    });

    it('does nothing while parts are readonly', () => {
      const { ctrl, day, commitGroup } = setupDate({ isReadonly: () => true });
      day.value = '15';
      day.dispatchEvent(new Event('change'));
      expect(ctrl.getPart('default', 'day')).toBe('');
      expect(commitGroup).not.toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('zero-pads a valid part in the DOM and dispatches the blur CustomEvent', () => {
      const { host, day, onEmptyPartBlur } = setupDate();
      const blurListener = vi.fn();
      host.addEventListener('blur', blurListener);
      day.value = '5';
      day.dispatchEvent(new FocusEvent('blur'));
      expect(day.value).toBe('05');
      expect(onEmptyPartBlur).not.toHaveBeenCalled();
      expect(blurListener).toHaveBeenCalledTimes(1);
    });

    it('pads to the descriptor maxLength (year 15 -> 0015)', () => {
      const { year } = setupDate();
      year.value = '15';
      year.dispatchEvent(new FocusEvent('blur'));
      expect(year.value).toBe('0015');
    });

    it('treats 0 as empty for one-based parts (day) and routes to onEmptyPartBlur', () => {
      const { day, onEmptyPartBlur } = setupDate();
      day.value = '0';
      day.dispatchEvent(new FocusEvent('blur'));
      expect(onEmptyPartBlur).toHaveBeenCalledTimes(1);
    });

    it('keeps 0 for zero-based parts (minute) and pads it', () => {
      const { startMinute, onEmptyPartBlur } = setupRangeTime('24');
      startMinute.value = '0';
      startMinute.dispatchEvent(new FocusEvent('blur'));
      expect(startMinute.value).toBe('00');
      expect(onEmptyPartBlur).not.toHaveBeenCalled();
    });

    it('routes an empty part to onEmptyPartBlur', () => {
      const { day, onEmptyPartBlur } = setupDate();
      day.value = '';
      day.dispatchEvent(new FocusEvent('blur'));
      expect(onEmptyPartBlur).toHaveBeenCalledTimes(1);
    });

    it('skips the numeric handling for dayPeriod parts but still dispatches blur', () => {
      const { host, startPeriod, onEmptyPartBlur } = setupRangeTime('12');
      const blurListener = vi.fn();
      host.addEventListener('blur', blurListener);
      (startPeriod as HTMLElement).dispatchEvent(new FocusEvent('blur'));
      expect(onEmptyPartBlur).not.toHaveBeenCalled();
      expect(blurListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleDayPeriod', () => {
    it('flips am -> pm -> am and commits each time', () => {
      const { ctrl, commitGroup } = setupRangeTime('12');
      ctrl.setPart('start', 'dayPeriod', 'am');
      ctrl.toggleDayPeriod('start', 'dayPeriod');
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('pm');
      ctrl.toggleDayPeriod('start', 'dayPeriod');
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('am');
      expect(commitGroup).toHaveBeenCalledTimes(2);
    });

    it('an unset period toggles to am', () => {
      const { ctrl } = setupRangeTime('12');
      ctrl.toggleDayPeriod('start', 'dayPeriod');
      expect(ctrl.getPart('start', 'dayPeriod')).toBe('am');
    });

    it('is blocked while readonly or disabled', () => {
      const readonly = setupRangeTime('12', { isReadonly: () => true });
      readonly.ctrl.toggleDayPeriod('start', 'dayPeriod');
      expect(readonly.ctrl.getPart('start', 'dayPeriod')).toBe('');
      expect(readonly.commitGroup).not.toHaveBeenCalled();

      const disabled = setupRangeTime('12', { isDisabled: () => true });
      disabled.ctrl.toggleDayPeriod('start', 'dayPeriod');
      expect(disabled.ctrl.getPart('start', 'dayPeriod')).toBe('');
      expect(disabled.commitGroup).not.toHaveBeenCalled();
    });
  });

  describe('segment focus', () => {
    it('getGroupInputs scopes by data-group in multi-group widgets, in DOM order', () => {
      const { ctrl, startHour, startMinute, endHour, endMinute } = setupRangeTime('24');
      expect(ctrl.getGroupInputs('start')).toEqual([startHour, startMinute]);
      expect(ctrl.getGroupInputs('end')).toEqual([endHour, endMinute]);
    });

    it('getGroupInputs uses the block part class for single-group widgets', () => {
      const { ctrl, day, month, year } = setupDate();
      expect(ctrl.getGroupInputs('default')).toEqual([day, month, year]);
    });

    it('selectPart selects inputs and ignores toggle buttons', () => {
      const { ctrl, startHour, startPeriod } = setupRangeTime('12');
      const select = vi.spyOn(startHour, 'select');
      ctrl.selectPart(startHour);
      expect(select).toHaveBeenCalledTimes(1);
      expect(() => ctrl.selectPart(startPeriod as HTMLElement)).not.toThrow();
    });

    it('focusFirst defers to the next animation frame (range pill-commit flow)', () => {
      const { ctrl, startHour } = setupRangeTime('24');
      ctrl.focusFirst('start');
      expect(document.activeElement).not.toBe(startHour);
      flushRaf();
      expect(document.activeElement).toBe(startHour);
    });

    it('focusFirst survives a group with no inputs', () => {
      const { ctrl } = setupRangeTime('24');
      ctrl.focusFirst('missing');
      expect(() => flushRaf()).not.toThrow();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('surfaced inputError flow', () => {
    it('surfaceInputError raises the flag and dispatches through the callback', () => {
      const onInputErrorSurfaced = vi.fn();
      const { ctrl } = setupDate({ onInputErrorSurfaced });
      ctrl.surfaceInputError('bad date');
      expect(ctrl.hasSurfacedInputError).toBe(true);
      expect(onInputErrorSurfaced).toHaveBeenCalledWith('bad date');
    });

    it('clearSurfacedInputError echoes the value only when an error was surfaced', () => {
      const onSurfacedErrorCleared = vi.fn();
      const { ctrl } = setupDate({ onSurfacedErrorCleared });

      ctrl.clearSurfacedInputError([]);
      expect(onSurfacedErrorCleared).not.toHaveBeenCalled();

      ctrl.surfaceInputError('bad date');
      ctrl.clearSurfacedInputError(['echo']);
      expect(ctrl.hasSurfacedInputError).toBe(false);
      expect(onSurfacedErrorCleared).toHaveBeenCalledWith(['echo']);

      ctrl.clearSurfacedInputError(['again']);
      expect(onSurfacedErrorCleared).toHaveBeenCalledTimes(1);
    });

    it('resetSurfacedInputError drops the flag without emitting', () => {
      const onSurfacedErrorCleared = vi.fn();
      const { ctrl } = setupDate({ onSurfacedErrorCleared });
      ctrl.surfaceInputError('bad date');
      ctrl.resetSurfacedInputError();
      expect(ctrl.hasSurfacedInputError).toBe(false);
      ctrl.clearSurfacedInputError([]);
      expect(onSurfacedErrorCleared).not.toHaveBeenCalled();
    });
  });

  describe('handleFocus', () => {
    it("re-dispatches as the host's focus CustomEvent carrying the original event", () => {
      const { ctrl, host } = setupDate();
      const listener = vi.fn();
      host.addEventListener('focus', listener);
      const original = new FocusEvent('focus');
      ctrl.handleFocus(original);
      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe(original);
    });
  });
});
