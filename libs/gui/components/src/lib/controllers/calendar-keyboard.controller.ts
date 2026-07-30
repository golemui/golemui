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
  /** Whether the previous month is reachable. */
  canGoPrev(): boolean;
  /** Whether the next month is reachable. */
  canGoNext(): boolean;
  /** Steps the host to the previous month. */
  goPrev(): void;
  /** Steps the host to the next month. */
  goNext(): void;
  /** Enter/Space on a day button. */
  onActivateDay(isoDate: string, event: KeyboardEvent): void;
  /** Applies a picked year to the host state. */
  onSelectYear(year: number): void;
  /** Closes the year grid. */
  onCloseYearGrid(): void;
  /** Whether the year grid is open. */
  isYearGridOpen(): boolean;
}

/** Keyboard navigation and focus management of the calendar components. */
export class GUICalendarKeyboardController implements ReactiveController {
  private host: GUICalendarKeyboardHost;
  private options: GUICalendarKeyboardControllerOptions;

  constructor(host: GUICalendarKeyboardHost, options: GUICalendarKeyboardControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // templates bind the handlers on the day buttons and the year grid.
  }

  /** The day-grid keydown. */
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

  /**
   * The year-grid movement with keyboard.
   *
   * - Arrows move ±1 (RTL-flipped) / ±4 with a plain bounds check
   * - Enter/Space select the target's `data-year`
   * - Escape closes the grid, stopping propagation so an outer popup does not also close.
   */
  handleYearKeydown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLButtonElement;
    if (!target.classList.contains(YEAR_BUTTON_CLASS)) return;

    const buttons = Array.from(this.host.querySelectorAll<HTMLButtonElement>(YEAR_BUTTON_SELECTOR));
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
      const yearBtn = this.host.querySelector(YEAR_SELECTOR_BUTTON_SELECTOR) as HTMLButtonElement;
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
   * When the grid just opened, waits for the update, then scrolls the current year
   * button into the middle of the grid viewport and focuses it. A close is a no-op.
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
    const currentBtn = this.host.querySelector(CURRENT_YEAR_BUTTON_SELECTOR) as HTMLButtonElement;
    currentBtn?.focus();
  }

  onPrevMonthClick = () => {
    this.options.goPrev();
    this.keepNavFocusInside('prev', 'next');
  };

  onNextMonthClick = () => {
    this.options.goNext();
    this.keepNavFocusInside('next', 'prev');
  };

  /**
   * After a nav click lands on a min/max boundary, the clicked button renders
   * disabled and would drop focus to the body; refocus the opposite nav
   * button, falling back to any enabled day button.
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
      ) ??
      this.host.querySelector<HTMLButtonElement>(
        '.gui-calendar__day-button:not([disabled]):not([aria-disabled="true"])',
      );
    fallback?.focus();
  }

  /**
   * Whether a queried button is disabled; a missing button counts as disabled.
   * Blocked in-month days carry `aria-disabled` instead of the native
   * attribute (they stay in the accessibility tree) — skip both alike.
   */
  private isButtonDisabled(button: HTMLButtonElement | undefined): boolean {
    if (!button) return true;
    return button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true';
  }
}
