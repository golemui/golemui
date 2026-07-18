import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { gridKeyStep, nextEnabledIndex } from '../utils/grid-nav';

export type GUICalendarKeyboardHost = ReactiveControllerHost & HTMLElement;

/**
 * Light-DOM selectors of the calendar components. Every calendar (single,
 * range, and their date-time flavors) renders these exact class names, so they
 * are shared constants rather than options.
 */
const DAY_BUTTON_SELECTOR = '.gui-calendar__day-button:not(.other-month)';
const PANEL_SELECTOR = '.gui-calendar__panel';
const YEAR_BUTTON_CLASS = 'gui-calendar__year-button';
const YEAR_BUTTON_SELECTOR = '.gui-calendar__year-button';
const CURRENT_YEAR_BUTTON_SELECTOR = '.gui-calendar__year-button.current';
const YEAR_GRID_SELECTOR = '.gui-calendar__year-grid';
const YEAR_SELECTOR_BUTTON_SELECTOR = '.gui-calendar__year-selector';
const FOCUSABLE_DAY_SELECTOR = '.gui-calendar__day-button[tabindex="0"]';

export interface GUICalendarKeyboardControllerOptions {
  /** Whether the previous month is reachable (the host's `canGoPrev`). */
  canGoPrev(): boolean;
  /** Whether the next month is reachable (the host's `canGoNext`). */
  canGoNext(): boolean;
  /** Steps the host to the previous month (the host's `prevMonth`). */
  goPrev(): void;
  /** Steps the host to the next month (the host's `nextMonth`). */
  goNext(): void;
  /**
   * Enter/Space on a day button (the abstract's `selectDate(day, event)`
   * call). `isoDate` is the button's `data-date` — every calendar stamps
   * `toISODateString(day.date)` there, which round-trips through
   * `parseISODateString` to the same local-midnight Date the render closure
   * carried, so the host can rebuild its day context or select by ISO
   * directly.
   */
  onActivateDay(isoDate: string, event: KeyboardEvent): void;
  /**
   * Applies a picked year to the host state — the assignment block of the
   * abstract's `selectYear`: set the current date to
   * `new Date(year, currentMonth, 1)` AND close the year grid, synchronously.
   * The focus choreography around it (year-selector button before, focusable
   * day after update) is the controller's.
   */
  onSelectYear(year: number): void;
  /** Closes the year grid (Escape path: `_yearSelectorOpen = false`). */
  onCloseYearGrid(): void;
  /**
   * Whether the year grid is open — gates
   * {@link GUICalendarKeyboardController.onYearGridToggled}, reproducing the
   * `if (this._yearSelectorOpen)` check of the abstract's
   * `toggleYearSelector`.
   */
  isYearGridOpen(): boolean;
}

/**
 * Keyboard navigation and focus management of the calendar components,
 * extracted from `AbstractCalendar` as a reactive controller. The host keeps
 * its month/year state, day generation and rendering; the controller owns:
 *
 * - {@link handleDayKeydown}: the day-grid keydown — arrow roving (RTL-aware,
 *   skipping disabled days via {@link nextEnabledIndex}), Enter/Space
 *   activation, and the month-rollover choreography (guarded goPrev/goNext,
 *   `await host.updateComplete`, per-panel button counting to retarget focus
 *   in the new month). Day buttons and panels are re-queried from the light
 *   DOM at event time, never cached — the retarget math depends on the
 *   freshly rendered month.
 * - {@link handleYearKeydown}: the year-grid keydown — ±1/±4 arrows with a
 *   plain bounds check (no disabled-skip: year buttons are never disabled),
 *   Enter/Space year selection, Escape close with focus restore.
 * - {@link selectYear}: the year-pick flow, including the
 *   focus-before-removal trick a Cypress test depends on.
 * - {@link onYearGridToggled}: the after-open scroll + focus of the current
 *   year button (the abstract's `toggleYearSelector` follow-up).
 * - {@link onPrevMonthClick}/{@link onNextMonthClick}: month-nav clicks with
 *   focus retention when the clicked button becomes disabled
 *   (`keepNavFocusInside`).
 *
 * The wrapper-div blur detection (`onFocusOut`'s rAF) is NOT here — hosts
 * compose `GUIFocusLeaveController` for it.
 */
export class GUICalendarKeyboardController implements ReactiveController {
  private host: GUICalendarKeyboardHost;
  private options: GUICalendarKeyboardControllerOptions;

  constructor(host: GUICalendarKeyboardHost, options: GUICalendarKeyboardControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  /** No lifecycle work; present so the class satisfies ReactiveController. */
  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // templates bind the handlers on the day buttons and the year grid.
  }

  // --- Day grid ---

  /**
   * The day-grid keydown (the abstract's `handleKeydown`). Template-bindable:
   * `@keydown=${(e) => controller.handleDayKeydown(e)}` on each day button.
   *
   * Exact port notes:
   * - Only arrow keys, Space and Enter are handled; anything else returns
   *   without preventDefault.
   * - The in-month day buttons (`:not(.other-month)`) are queried at event
   *   time; `currentIndex` is the target's position among them.
   * - Arrows map through {@link gridKeyStep} (columns 7, RTL-flipped
   *   horizontals). The isNavKey guard above means only delta intents can
   *   reach the mapping ('edge'/'none' are ignored, preserving the day grid's
   *   unhandled Home/End).
   * - A walk off either end rolls the month over when `canGoPrev`/`canGoNext`
   *   allow it; otherwise focus clamps to the first/last enabled button.
   * - After a rollover, the buttons are RE-queried, the raw out-of-bounds
   *   index is converted into the new month via per-panel button counts, and
   *   a disabled landing day is corrected by walking `step` again (falling
   *   back to the first enabled button when the correction exits the list).
   */
  handleDayKeydown = async (event: KeyboardEvent): Promise<void> => {
    const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isNavKey && event.key !== ' ' && event.key !== 'Enter') return;

    const target = event.target as HTMLButtonElement;
    const buttons = Array.from(this.host.querySelectorAll<HTMLButtonElement>(DAY_BUTTON_SELECTOR));
    const currentIndex = buttons.indexOf(target);
    const isRTL = window.getComputedStyle(this.host).direction === 'rtl';

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.options.onActivateDay(target.dataset['date'] ?? '', event);
      return;
    }

    const intent = gridKeyStep(event.key, { columns: 7, isRTL });
    if (intent.kind !== 'delta') return;
    const step = intent.delta;

    event.preventDefault();

    const nextIndex = nextEnabledIndex(currentIndex, step, buttons.length, (index) =>
      this.isButtonDisabled(buttons[index]),
    );
    let monthChanged = false;

    if (nextIndex < 0) {
      if (this.options.canGoPrev()) {
        this.options.goPrev();
        monthChanged = true;
      } else {
        // The previous month is beyond the minimum date, so we select the first available button
        const firstEnabledBtn = buttons.find((b) => !this.isButtonDisabled(b));
        firstEnabledBtn?.focus();
        return;
      }
    } else if (nextIndex >= buttons.length) {
      if (this.options.canGoNext()) {
        this.options.goNext();
        monthChanged = true;
      } else {
        // The next month is beyond the maximum date, so we select the first available button
        const reverseButtons = [...buttons].reverse();
        const lastEnabledBtn = reverseButtons.find((b) => !this.isButtonDisabled(b));
        lastEnabledBtn?.focus();
        return;
      }
    }

    if (monthChanged) {
      await this.host.updateComplete;

      const newButtons = Array.from(
        this.host.querySelectorAll<HTMLButtonElement>(DAY_BUTTON_SELECTOR),
      );

      const panels = Array.from(this.host.querySelectorAll(PANEL_SELECTOR));
      let targetIndex: number;

      if (nextIndex < 0) {
        const firstPanelButtonCount = panels[0].querySelectorAll(DAY_BUTTON_SELECTOR).length;
        targetIndex = firstPanelButtonCount + nextIndex;
      } else {
        const lastPanel = panels[panels.length - 1];
        const lastPanelButtonCount = lastPanel.querySelectorAll(DAY_BUTTON_SELECTOR).length;
        targetIndex = newButtons.length - lastPanelButtonCount + (nextIndex - buttons.length);
      }

      if (this.isButtonDisabled(newButtons[targetIndex])) {
        const correctedIndex = nextEnabledIndex(targetIndex, step, newButtons.length, (index) =>
          this.isButtonDisabled(newButtons[index]),
        );

        // Try to find the next day enabled in the new month
        if (correctedIndex < 0 || correctedIndex >= newButtons.length) {
          const firstEnabled = newButtons.findIndex((b) => !this.isButtonDisabled(b));
          if (firstEnabled > -1) newButtons[firstEnabled].focus();
        } else {
          newButtons[correctedIndex]?.focus();
        }
      } else {
        const safeIndex = Math.max(0, Math.min(targetIndex, newButtons.length - 1));
        newButtons[safeIndex]?.focus();
      }
    } else {
      buttons[nextIndex]?.focus();
    }
  };

  // --- Year grid ---

  /**
   * The year-grid keydown (the abstract's `handleYearKeydown`).
   * Template-bindable on the grid container:
   * `@keydown=${controller.handleYearKeydown}` — events from anything but a
   * year button are ignored.
   *
   * Arrows move ±1 (RTL-flipped) / ±4 with a plain bounds check — no
   * disabled-skip and no month rollover, exactly like the original.
   * Enter/Space select the target's `data-year`; Escape closes the grid,
   * stopping propagation so an outer popup does not also close.
   */
  handleYearKeydown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLButtonElement;
    if (!target.classList.contains(YEAR_BUTTON_CLASS)) return;

    const buttons = Array.from(
      this.host.querySelectorAll<HTMLButtonElement>(YEAR_BUTTON_SELECTOR),
    );
    const currentIndex = buttons.indexOf(target);
    const isRTL = window.getComputedStyle(this.host).direction === 'rtl';

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const year = parseInt(target.dataset['year'] ?? '', 10);
      if (!isNaN(year)) this.selectYear(year);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      // Move focus to year selector button BEFORE removing the year grid
      const yearBtn = this.host.querySelector(
        YEAR_SELECTOR_BUTTON_SELECTOR,
      ) as HTMLButtonElement;
      yearBtn?.focus();
      this.options.onCloseYearGrid();
      return;
    }

    const intent = gridKeyStep(event.key, { columns: 4, isRTL });
    if (intent.kind !== 'delta') return;

    event.preventDefault();
    const nextIndex = currentIndex + intent.delta;
    if (nextIndex >= 0 && nextIndex < buttons.length) {
      buttons[nextIndex].focus();
    }
  };

  /**
   * Picks a year (the abstract's `selectYear`) — public so the year-grid
   * template's button clicks can call it too. The state assignment is
   * delegated to `onSelectYear`; the focus choreography around it is
   * preserved exactly, including the focus-before-removal trick below (a
   * Cypress test depends on the pickers staying open through a year pick).
   */
  selectYear(year: number): void {
    // Move focus to the year selector button BEFORE removing the year grid,
    // so focusout fires with relatedTarget inside the component and date pickers don't close.
    const yearSelectorBtn = this.host.querySelector(
      YEAR_SELECTOR_BUTTON_SELECTOR,
    ) as HTMLButtonElement;
    yearSelectorBtn?.focus();

    this.options.onSelectYear(year);
    this.host.updateComplete.then(() => {
      const focusableDay = this.host.querySelector<HTMLButtonElement>(FOCUSABLE_DAY_SELECTOR);
      focusableDay?.focus();
    });
  }

  /**
   * The follow-up of the abstract's `toggleYearSelector`: call right after
   * the host flips its year-grid state. When the grid just opened, waits for
   * the update, then scrolls the current year button into the middle of the
   * grid viewport and focuses it — the exact `updateComplete.then(...)`
   * sequencing of the original. A close is a no-op.
   */
  onYearGridToggled(): void {
    if (!this.options.isYearGridOpen()) return;
    this.host.updateComplete.then(() => {
      this.scrollToCurrentYear();
      this.focusCurrentYearButton();
    });
  }

  private scrollToCurrentYear(): void {
    const yearGrid = this.host.querySelector(YEAR_GRID_SELECTOR);
    const currentBtn = this.host.querySelector(CURRENT_YEAR_BUTTON_SELECTOR) as HTMLElement;
    if (yearGrid && currentBtn) {
      const gridRect = yearGrid.getBoundingClientRect();
      const btnRect = currentBtn.getBoundingClientRect();
      const scrollTop =
        yearGrid.scrollTop +
        (btnRect.top - gridRect.top) -
        gridRect.height / 2 +
        btnRect.height / 2;
      yearGrid.scrollTop = Math.max(0, scrollTop);
    }
  }

  private focusCurrentYearButton(): void {
    const currentBtn = this.host.querySelector(
      CURRENT_YEAR_BUTTON_SELECTOR,
    ) as HTMLButtonElement;
    currentBtn?.focus();
  }

  // --- Month navigation ---

  /**
   * Prev-month click (the abstract's `onPrevMonthClick`): steps the month,
   * then keeps focus inside when the clicked button disables itself.
   */
  onPrevMonthClick = () => {
    this.options.goPrev();
    this.keepNavFocusInside('prev', 'next');
  };

  /** Next-month click (the abstract's `onNextMonthClick`). */
  onNextMonthClick = () => {
    this.options.goNext();
    this.keepNavFocusInside('next', 'prev');
  };

  /**
   * After a nav click lands on a min/max boundary, the clicked button renders
   * disabled and would drop focus to the body; refocus the opposite nav
   * button, falling back to any enabled day button (the abstract's
   * `keepNavFocusInside`).
   */
  private async keepNavFocusInside(clicked: 'prev' | 'next', opposite: 'prev' | 'next') {
    await this.host.updateComplete;
    const clickedBtn = this.host.querySelector<HTMLButtonElement>(
      `.gui-calendar__month-button--${clicked}`,
    );
    if (!clickedBtn || !clickedBtn.disabled) return;
    const fallback =
      this.host.querySelector<HTMLButtonElement>(
        `.gui-calendar__month-button--${opposite}:not([disabled])`,
      ) ?? this.host.querySelector<HTMLButtonElement>('.gui-calendar__day-button:not([disabled])');
    fallback?.focus();
  }

  /**
   * Whether a queried button is disabled; a missing button counts as disabled
   * (the abstract's `isButtonDisabled`, whose undefined-tolerance the
   * out-of-bounds `targetIndex` probe relies on).
   */
  private isButtonDisabled(button: HTMLButtonElement | undefined): boolean {
    if (!button) return true;
    return button.hasAttribute('disabled');
  }
}
