// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  GUICalendarKeyboardController,
  type GUICalendarKeyboardControllerOptions,
  type GUICalendarKeyboardHost,
} from './calendar-keyboard.controller';

/**
 * Characterization tests for the calendar keyboard navigation extracted from
 * AbstractCalendar. A fake light-DOM calendar (panels of day buttons, a year
 * grid, month-nav buttons) stands in for the components; the DOM is mutated
 * synchronously by the goPrev/goNext callbacks the way a Lit re-render would
 * before `updateComplete` resolves in the real host.
 */

function createHost(): GUICalendarKeyboardHost {
  const controllers: ReactiveController[] = [];
  const el = document.createElement('div') as unknown as GUICalendarKeyboardHost;
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

interface Setup {
  host: GUICalendarKeyboardHost;
  ctrl: GUICalendarKeyboardController;
  options: GUICalendarKeyboardControllerOptions;
}

function setup(overrides: Partial<GUICalendarKeyboardControllerOptions> = {}): Setup {
  const host = createHost();
  const options: GUICalendarKeyboardControllerOptions = {
    canGoPrev: () => true,
    canGoNext: () => true,
    goPrev: vi.fn(),
    goNext: vi.fn(),
    onActivateDay: vi.fn(),
    onSelectYear: vi.fn(),
    onCloseYearGrid: vi.fn(),
    isYearGridOpen: () => false,
    ...overrides,
  };
  const ctrl = new GUICalendarKeyboardController(host, options);
  return { host, ctrl, options };
}

/** The promise of the last handleDayKeydown call, captured by the wiring. */
let pendingDayKeydown: Promise<void> | undefined;

function dayButton(
  iso: string,
  opts: { disabled?: boolean; otherMonth?: boolean; focusable?: boolean } = {},
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gui-calendar__day-button' + (opts.otherMonth ? ' other-month' : '');
  btn.dataset['date'] = iso;
  btn.tabIndex = opts.focusable ? 0 : -1;
  if (opts.disabled || opts.otherMonth) btn.setAttribute('disabled', '');
  return btn;
}

/**
 * Renders one month panel of day buttons wired to the controller. `disabled`
 * lists 1-based day numbers rendered with the disabled attribute.
 */
function renderPanel(
  host: HTMLElement,
  ctrl: GUICalendarKeyboardController,
  isoMonth: string,
  dayCount: number,
  disabled: number[] = [],
): HTMLButtonElement[] {
  const panel = document.createElement('div');
  panel.className = 'gui-calendar__panel';
  const buttons: HTMLButtonElement[] = [];
  for (let dayNum = 1; dayNum <= dayCount; dayNum++) {
    const iso = `${isoMonth}-${String(dayNum).padStart(2, '0')}`;
    const btn = dayButton(iso, { disabled: disabled.includes(dayNum) });
    btn.addEventListener('keydown', (e) => {
      pendingDayKeydown = ctrl.handleDayKeydown(e as KeyboardEvent);
    });
    panel.appendChild(btn);
    buttons.push(btn);
  }
  host.appendChild(panel);
  return buttons;
}

async function pressDayKey(el: HTMLElement, key: string): Promise<KeyboardEvent> {
  pendingDayKeydown = undefined;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  await pendingDayKeydown;
  return event;
}

function keydown(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

function mockRTL() {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    direction: 'rtl',
  } as CSSStyleDeclaration);
}

/** Renders the year grid + the year-selector toggle button. */
function renderYearGrid(
  host: HTMLElement,
  ctrl: GUICalendarKeyboardController,
  years: number[],
  currentYear: number,
): { grid: HTMLDivElement; buttons: HTMLButtonElement[]; toggle: HTMLButtonElement } {
  const toggle = document.createElement('button');
  toggle.className = 'gui-calendar__year-selector';
  host.appendChild(toggle);

  const grid = document.createElement('div');
  grid.className = 'gui-calendar__year-grid';
  grid.addEventListener('keydown', (e) => ctrl.handleYearKeydown(e as KeyboardEvent));
  const buttons = years.map((year) => {
    const btn = document.createElement('button');
    btn.className = 'gui-calendar__year-button' + (year === currentYear ? ' current' : '');
    btn.dataset['year'] = String(year);
    btn.tabIndex = year === currentYear ? 0 : -1;
    grid.appendChild(btn);
    return btn;
  });
  host.appendChild(grid);
  return { grid, buttons, toggle };
}

function navButton(dir: 'prev' | 'next', disabled = false): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `gui-button gui-calendar__month-button gui-calendar__month-button--${dir}`;
  if (disabled) btn.setAttribute('disabled', '');
  return btn;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  pendingDayKeydown = undefined;
});

describe('GUICalendarKeyboardController', () => {
  describe('day grid arrows', () => {
    it('ArrowRight moves focus one day forward and prevents default', async () => {
      const { host, ctrl } = setup();
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      buttons[9].focus();
      const event = await pressDayKey(buttons[9], 'ArrowRight');
      expect(document.activeElement).toBe(buttons[10]);
      expect(event.defaultPrevented).toBe(true);
    });

    it('ArrowLeft moves one day back; ArrowUp/ArrowDown move by 7', async () => {
      const { host, ctrl } = setup();
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      buttons[14].focus();
      await pressDayKey(buttons[14], 'ArrowLeft');
      expect(document.activeElement).toBe(buttons[13]);
      await pressDayKey(buttons[13], 'ArrowUp');
      expect(document.activeElement).toBe(buttons[6]);
      await pressDayKey(buttons[6], 'ArrowDown');
      expect(document.activeElement).toBe(buttons[13]);
    });

    it('flips horizontal arrows in RTL', async () => {
      const { host, ctrl } = setup();
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      mockRTL();
      buttons[9].focus();
      await pressDayKey(buttons[9], 'ArrowRight');
      expect(document.activeElement).toBe(buttons[8]);
      await pressDayKey(buttons[8], 'ArrowLeft');
      expect(document.activeElement).toBe(buttons[9]);
    });

    it('skips disabled day buttons in the walk direction', async () => {
      const { host, ctrl } = setup();
      const buttons = renderPanel(host, ctrl, '2026-07', 31, [11, 12]);
      buttons[9].focus();
      await pressDayKey(buttons[9], 'ArrowRight');
      expect(document.activeElement).toBe(buttons[12]);
    });

    it('excludes other-month buttons from the roving index space', async () => {
      const { host, ctrl } = setup();
      const panel = document.createElement('div');
      panel.className = 'gui-calendar__panel';
      const filler = dayButton('2026-06-30', { otherMonth: true });
      const first = dayButton('2026-07-01');
      const second = dayButton('2026-07-02');
      [filler, first, second].forEach((btn) => {
        btn.addEventListener('keydown', (e) => {
          pendingDayKeydown = ctrl.handleDayKeydown(e as KeyboardEvent);
        });
        panel.appendChild(btn);
      });
      host.appendChild(panel);

      first.focus();
      await pressDayKey(first, 'ArrowRight');
      expect(document.activeElement).toBe(second);
    });

    it('ignores non-navigation keys without preventing default', async () => {
      const { host, ctrl } = setup();
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      buttons[9].focus();
      const event = await pressDayKey(buttons[9], 'Escape');
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(buttons[9]);
    });
  });

  describe('day activation', () => {
    it('Enter activates the day with its data-date and the event', async () => {
      const onActivateDay = vi.fn();
      const { host, ctrl } = setup({ onActivateDay });
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      buttons[9].focus();
      const event = await pressDayKey(buttons[9], 'Enter');
      expect(onActivateDay).toHaveBeenCalledWith('2026-07-10', event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('Space activates the day too', async () => {
      const onActivateDay = vi.fn();
      const { host, ctrl } = setup({ onActivateDay });
      const buttons = renderPanel(host, ctrl, '2026-07', 31);
      buttons[0].focus();
      await pressDayKey(buttons[0], ' ');
      expect(onActivateDay).toHaveBeenCalledWith('2026-07-01', expect.any(KeyboardEvent));
    });
  });

  describe('month rollover', () => {
    it('walking past the end goes to the next month and retargets by overshoot', async () => {
      const { host, ctrl, options } = setup({
        goNext: vi.fn(() => {
          host.innerHTML = '';
          renderPanel(host, ctrl, '2026-08', 31);
        }),
      });
      const july = renderPanel(host, ctrl, '2026-07', 31);
      july[29].focus(); // July 30
      await pressDayKey(july[29], 'ArrowDown'); // raw next index 36 -> overshoot 5
      expect(options.goNext).toHaveBeenCalledTimes(1);
      expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-08-06');
    });

    it('walking before the start goes to the previous month and retargets from its end', async () => {
      const { host, ctrl, options } = setup({
        goPrev: vi.fn(() => {
          host.innerHTML = '';
          renderPanel(host, ctrl, '2026-06', 30);
        }),
      });
      const july = renderPanel(host, ctrl, '2026-07', 31);
      july[2].focus(); // July 3
      await pressDayKey(july[2], 'ArrowUp'); // raw next index -5
      expect(options.goPrev).toHaveBeenCalledTimes(1);
      // firstPanelButtonCount (30) + (-5) = index 25 -> June 26
      expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-06-26');
    });

    it('clamps to the last enabled button when the next month is not reachable', async () => {
      const { host, ctrl, options } = setup({ canGoNext: () => false });
      const buttons = renderPanel(host, ctrl, '2026-07', 31, [31]);
      buttons[29].focus();
      await pressDayKey(buttons[29], 'ArrowDown');
      expect(options.goNext).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(buttons[29]); // 31 disabled -> day 30 is last enabled
    });

    it('clamps to the first enabled button when the previous month is not reachable', async () => {
      const { host, ctrl, options } = setup({ canGoPrev: () => false });
      const buttons = renderPanel(host, ctrl, '2026-07', 31, [1]);
      buttons[3].focus();
      await pressDayKey(buttons[3], 'ArrowUp');
      expect(options.goPrev).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(buttons[1]); // day 1 disabled -> day 2
    });

    it('corrects a disabled landing day in the new month by walking the same step', async () => {
      const { host, ctrl } = setup({
        goNext: vi.fn(() => {
          host.innerHTML = '';
          renderPanel(host, ctrl, '2026-08', 31, [6]);
        }),
      });
      const july = renderPanel(host, ctrl, '2026-07', 31);
      july[29].focus();
      await pressDayKey(july[29], 'ArrowDown'); // lands on Aug 6, disabled -> +7 -> Aug 13
      expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-08-13');
    });

    it('falls back to the first enabled day when the correction walks out of the month', async () => {
      const { host, ctrl } = setup({
        goNext: vi.fn(() => {
          host.innerHTML = '';
          // Landing day 6 and every +7 sibling disabled: 6, 13, 20, 27
          renderPanel(host, ctrl, '2026-08', 31, [1, 6, 13, 20, 27]);
        }),
      });
      const july = renderPanel(host, ctrl, '2026-07', 31);
      july[29].focus();
      await pressDayKey(july[29], 'ArrowDown');
      // Day 1 also disabled -> first enabled is Aug 2
      expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-08-02');
    });
  });

  describe('year grid keydown', () => {
    it('moves ±1 with horizontal arrows and ±4 vertically', () => {
      const { host, ctrl } = setup();
      const { buttons } = renderYearGrid(host, ctrl, [2020, 2021, 2022, 2023, 2024, 2025], 2022);
      buttons[1].focus();
      keydown(buttons[1], 'ArrowRight');
      expect(document.activeElement).toBe(buttons[2]);
      keydown(buttons[2], 'ArrowLeft');
      expect(document.activeElement).toBe(buttons[1]);
      keydown(buttons[1], 'ArrowDown');
      expect(document.activeElement).toBe(buttons[5]);
      keydown(buttons[5], 'ArrowUp');
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('flips horizontal arrows in RTL', () => {
      const { host, ctrl } = setup();
      const { buttons } = renderYearGrid(host, ctrl, [2020, 2021, 2022, 2023], 2021);
      mockRTL();
      buttons[1].focus();
      keydown(buttons[1], 'ArrowRight');
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('stays put at the grid edges', () => {
      const { host, ctrl } = setup();
      const { buttons } = renderYearGrid(host, ctrl, [2020, 2021, 2022], 2020);
      buttons[0].focus();
      keydown(buttons[0], 'ArrowLeft');
      expect(document.activeElement).toBe(buttons[0]);
      keydown(buttons[0], 'ArrowUp');
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('ignores keydown events that do not target a year button', () => {
      const { host, ctrl } = setup();
      const { grid, buttons } = renderYearGrid(host, ctrl, [2020, 2021], 2020);
      buttons[0].focus();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      grid.dispatchEvent(event); // target is the grid, not a button
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('Enter selects the target year, focusing the year-selector button first', async () => {
      const focusAtCall: (Element | null)[] = [];
      const { host, ctrl, options } = setup({
        onSelectYear: vi.fn(() => {
          focusAtCall.push(document.activeElement);
        }),
      });
      const { buttons, toggle } = renderYearGrid(host, ctrl, [2020, 2021, 2022], 2021);
      const focusableDay = dayButton('2021-07-01', { focusable: true });
      host.appendChild(focusableDay);

      buttons[2].focus();
      keydown(buttons[2], 'Enter');
      expect(options.onSelectYear).toHaveBeenCalledWith(2022);
      expect(focusAtCall[0]).toBe(toggle);

      await Promise.resolve();
      await Promise.resolve();
      expect(document.activeElement).toBe(focusableDay);
    });

    it('Escape restores focus to the year-selector button, closes the grid and stops propagation', () => {
      const { host, ctrl, options } = setup();
      const { grid, buttons, toggle } = renderYearGrid(host, ctrl, [2020, 2021], 2020);
      const outerListener = vi.fn();
      document.addEventListener('keydown', outerListener);

      buttons[0].focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      buttons[0].dispatchEvent(event);

      expect(document.activeElement).toBe(toggle);
      expect(options.onCloseYearGrid).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
      expect(outerListener).not.toHaveBeenCalled();

      document.removeEventListener('keydown', outerListener);
      expect(grid.isConnected).toBe(true); // removal is the host's job
    });
  });

  describe('year grid open flow', () => {
    it('focuses (and scrolls to) the current year button after the grid opens', async () => {
      const { host, ctrl } = setup({ isYearGridOpen: () => true });
      const { buttons } = renderYearGrid(host, ctrl, [2020, 2021, 2022], 2021);
      ctrl.onYearGridToggled();
      await Promise.resolve();
      await Promise.resolve();
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('does nothing when the grid just closed', async () => {
      const { host, ctrl } = setup({ isYearGridOpen: () => false });
      const { buttons } = renderYearGrid(host, ctrl, [2020, 2021], 2020);
      buttons[1].focus();
      ctrl.onYearGridToggled();
      await Promise.resolve();
      await Promise.resolve();
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('month-nav focus retention', () => {
    it('steps the month on click and leaves focus alone while the button stays enabled', async () => {
      const { host, ctrl, options } = setup();
      const prev = navButton('prev');
      const next = navButton('next');
      host.append(prev, next);
      prev.focus();
      ctrl.onPrevMonthClick();
      await Promise.resolve();
      await Promise.resolve();
      expect(options.goPrev).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(prev);
    });

    it('moves focus to the opposite nav button when the clicked one becomes disabled', async () => {
      const { host, ctrl } = setup({
        goPrev: vi.fn(() => {
          host.querySelector('.gui-calendar__month-button--prev')?.setAttribute('disabled', '');
        }),
      });
      const prev = navButton('prev');
      const next = navButton('next');
      host.append(prev, next);
      prev.focus();
      ctrl.onPrevMonthClick();
      await Promise.resolve();
      await Promise.resolve();
      expect(document.activeElement).toBe(next);
    });

    it('falls back to an enabled day button when both nav buttons are disabled', async () => {
      const { host, ctrl } = setup({
        goNext: vi.fn(() => {
          host.querySelector('.gui-calendar__month-button--next')?.setAttribute('disabled', '');
        }),
      });
      const prev = navButton('prev', true);
      const next = navButton('next');
      const day = dayButton('2026-07-15');
      host.append(prev, next, day);
      next.focus();
      ctrl.onNextMonthClick();
      await Promise.resolve();
      await Promise.resolve();
      expect(document.activeElement).toBe(day);
    });
  });
});
