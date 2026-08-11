import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import type { GuiPillKeydownEventDetail, GuiPills } from '../components/pills';

export type GUIPillsNavigationHost = ReactiveControllerHost & HTMLElement;

export interface GUIPillsNavigationControllerOptions {
  /** The `<gui-pills>` element this controller drives. */
  getPills(): GuiPills | null;
  /** Current pill count; entry is refused at 0. */
  getPillCount(): number;
  /**
   * Moves focus to the linked input at its logical start (tags: the text
   * input; segmented inputs: the first part of the start group).
   */
  focusLinkedInput(): void;
}

/**
 * The linked-input half of the pill keyboard model: `GuiPills` owns roving
 * focus inside the strip/dropdown and re-emits boundary keys, this controller
 * owns the handoffs between the pills and the host's input.
 *
 * The host decides *when* to enter the pill list (a text input checks its
 * caret, a segmented input hooks `onNavigatePastStart`) and binds:
 *   - `@pillkeydown=${controller.onPillKeydown}` — ArrowRight past the last
 *     strip pill returns focus to the linked input
 *   - `@pillexit=${controller.onPillExit}` — Escape closed the dropdown;
 *     focus returns to the linked input
 */
export class GUIPillsNavigationController implements ReactiveController {
  private options: GUIPillsNavigationControllerOptions;

  constructor(host: GUIPillsNavigationHost, options: GUIPillsNavigationControllerOptions) {
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // template binds the handlers on gui-pills.
  }

  /** Bind as `@pillkeydown`. */
  onPillKeydown = (e: CustomEvent<GuiPillKeydownEventDetail>): void => {
    const ev = e.detail.event;
    // ArrowRight past the last pill (in strip mode) → return focus to input.
    if (ev.key === 'ArrowRight' && !this.isDropdownOpen()) {
      this.options.focusLinkedInput();
    }
  };

  /** Bind as `@pillexit`. */
  onPillExit = (): void => {
    this.focusLinkedInputDeferred();
  };

  /**
   * Enter the pill list from the linked input. Defaults to the last pill in
   * strip mode; in compact mode the strip is hidden, so the dropdown is opened
   * first and focus lands on the first pill (top of the vertical list).
   */
  enterPillList(index?: number): void {
    const pills = this.options.getPills();
    const count = this.options.getPillCount();
    if (!pills || count === 0) return;
    if (this.isCompactMode()) {
      pills.openDropdown();
      requestAnimationFrame(() => pills.focusPillAt(index ?? 0));
    } else {
      pills.focusPillAt(index ?? count - 1);
    }
  }

  /** For `pillremove` hosts: refocus the linked input once the strip is gone. */
  focusLinkedInputDeferred(): void {
    requestAnimationFrame(() => this.options.focusLinkedInput());
  }

  isDropdownOpen(): boolean {
    const pills = this.options.getPills();
    return !!pills?.querySelector('.gui-pills__dropdown');
  }

  /** True when the host wrapper has shrunk past the compact threshold and
   *  gui-pills is displaying the bubble instead of the strip. */
  isCompactMode(): boolean {
    const pills = this.options.getPills();
    if (!pills) return false;
    const wrapper = pills.querySelector<HTMLElement>('.gui-pills__strip-wrapper');
    return wrapper ? getComputedStyle(wrapper).display === 'none' : false;
  }
}
