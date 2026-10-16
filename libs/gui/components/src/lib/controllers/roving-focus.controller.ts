import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { rovingStep, typeaheadMatch } from '../utils/roving';

export interface GUIRovingFocusOptions {
  /** The items, in order. */
  items(): HTMLElement[];
  /** Which arrows move the focus: ArrowLeft/Right, mirrored in right to left, or ArrowUp/Down. */
  orientation: 'horizontal' | 'vertical';
  /** Whether moving past an end goes round to the other. Default false. */
  wrap?: boolean;
  /** Whether typing letters moves to the next item whose text starts with them. Default false. */
  typeahead?: boolean;
  /** Whether an item can't take focus, so a move skips it. */
  isDisabled?(item: HTMLElement): boolean;
  /** Runs once the focus has moved to an item: tabs select it. */
  onMove?(item: HTMLElement): void;
}

/** How long typeahead keeps the letters typed before it starts a new search, in ms. */
const TYPEAHEAD_RESET = 500;

/**
 * Moves the focus among a row or column of items with the keyboard: the arrows of the
 * orientation, Home and End, and optionally typeahead. Its host calls `handleKeyDown` from the
 * keydown of an item. Which item is in the tab order (`tabindex`) stays the host's business: tabs
 * keep the selected tab there, a menu none.
 *
 * ```ts
 * private roving = new GUIRovingFocusController(this, {
 *   items: () => this.items,
 *   orientation: 'vertical',
 *   wrap: true,
 *   typeahead: true,
 * });
 * ```
 */
export class GUIRovingFocusController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly options: GUIRovingFocusOptions;
  private query = '';
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(host: ReactiveControllerHost & HTMLElement, options: GUIRovingFocusOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostDisconnected(): void {
    this.resetQuery();
  }

  /**
   * Moves the focus for a keydown on `from`, one of the items, and consumes the key. Returns the
   * item it moved to, or undefined when the key moves nothing.
   */
  handleKeyDown(event: KeyboardEvent, from: HTMLElement): HTMLElement | undefined {
    const items = this.options.items();
    const index = items.indexOf(from);
    if (index === -1) return undefined;

    let target = this.step(event.key, index, items);
    if (target === -1 && this.options.typeahead && this.isTypeahead(event)) {
      target = this.typeahead(event.key, index, items);
      // A key typeahead used finds nothing more: it is still consumed.
      if (target === -1 || target === index) {
        event.preventDefault();
        return undefined;
      }
    }
    if (target === -1) return undefined;

    event.preventDefault();
    return this.focus(items[target]);
  }

  /** Focuses the first enabled item, where Home leads: a menu opening. */
  focusFirst(): HTMLElement | undefined {
    return this.focusFromNowhere('Home');
  }

  /** Focuses the last enabled item, where End leads: a menu opening upwards. */
  focusLast(): HTMLElement | undefined {
    return this.focusFromNowhere('End');
  }

  /** Focuses where a key leads before any item has focus. */
  private focusFromNowhere(key: 'Home' | 'End') {
    const items = this.options.items();
    const target = this.step(key, -1, items);
    return target === -1 ? undefined : this.focus(items[target]);
  }

  /** The index a navigation key leads to from `index`, or -1: see rovingStep. */
  private step(key: string, index: number, items: HTMLElement[]): number {
    return rovingStep(key, index, items.length, {
      orientation: this.options.orientation,
      rtl: getComputedStyle(this.host).direction === 'rtl',
      wrap: this.options.wrap,
      isDisabled: this.disabledIn(items),
    });
  }

  /** Adds a key to the search, and returns the index of the item it finds, or -1. */
  private typeahead(key: string, index: number, items: HTMLElement[]): number {
    this.query += key;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.resetQuery(), TYPEAHEAD_RESET);
    const labels = items.map((item) => item.textContent ?? '');
    return typeaheadMatch(this.query, labels, index, this.disabledIn(items));
  }

  private disabledIn(items: HTMLElement[]) {
    return (index: number) => !!this.options.isDisabled?.(items[index]);
  }

  /** The one place the focus moves: then the host hears of it. */
  private focus(item: HTMLElement) {
    item.focus();
    this.options.onMove?.(item);
    return item;
  }

  /**
   * A printable key without a modifier (Ctrl+C is a shortcut): a space only continues a search, as
   * it activates an item otherwise.
   */
  private isTypeahead(event: KeyboardEvent) {
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return false;
    return event.key !== ' ' || this.query !== '';
  }

  private resetQuery() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.query = '';
  }
}
