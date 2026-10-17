import { type PropertyValues } from 'lit';
import { safeDefine } from '@golemui/lit-utils';
import { GUIRovingFocusController } from '../controllers/roving-focus.controller';
import { setIfMissing } from '../utils/attributes';
import { warnInDevelopment } from '../utils/dev';
import {
  dispatch,
  fires,
  type GuiActionEventDetail,
  type GuiToggleEventDetail,
} from '../utils/events';
import { GuiPopover } from './popover';

/** The items of a menu: its buttons and links, and anything the app gave the `menuitem` role. */
const ITEMS = ':scope > :is(button, a[href], [role="menuitem"])';

/**
 * A menu of actions, opened from a button: the menu button pattern. It is a `gui-popover` whose
 * panel holds the actions, so it opens, places itself and closes the same way, and fires
 * `gui-toggle`.
 *
 * ```html
 * <button popovertarget="row-actions">Actions</button>
 * <gui-menu>
 *   <div id="row-actions" popover>
 *     <button value="edit">Edit</button>
 *     <button value="duplicate">Duplicate</button>
 *     <hr />
 *     <button value="delete">Delete</button>
 *   </div>
 * </gui-menu>
 * ```
 *
 * The element gives the panel the `menu` role and its buttons and links the `menuitem` role (an
 * `<hr>` is a separator already), takes the items out of the tab order, gives the button
 * `aria-haspopup="menu"`, and names the menu after the button when it has an id. A role or name
 * the app wrote stays.
 *
 * It follows the APG menu button pattern:
 * - Opening focuses the first item, or the last for ArrowUp on the button. ArrowDown on the button
 *   opens it too.
 * - ArrowUp and ArrowDown move through the items and wrap, Home and End go to the ends, and typing
 *   moves to the next item that starts with the letters.
 * - Enter, Space or a click picks an item: the menu fires `gui-action`, closes and returns focus to
 *   the button. Escape closes it the same way, and Tab closes it and moves on.
 *
 * @fires gui-toggle - The menu opened or closed. `detail.open` is the new state.
 * @fires gui-action - The user picked an item. `detail.value` is its `value` (or its text), and
 *   `detail.item` the item.
 */
export class GuiMenu extends GuiPopover {
  private roving = new GUIRovingFocusController(this, {
    items: () => this.items,
    orientation: 'vertical',
    wrap: true,
    typeahead: true,
    isDisabled: (item) =>
      (item as HTMLButtonElement).disabled === true ||
      item.getAttribute('aria-disabled') === 'true',
  });

  private invoker: Element | null = null;
  private openToLast = false;
  private menuMutations?: MutationObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);
    this.addEventListener('focusout', this.onFocusOut);
    // The app renders, or re-renders, the panel and its items after the element connects.
    this.menuMutations = new MutationObserver(() => this.syncMenu());
    this.menuMutations.observe(this, { childList: true, subtree: true });
    this.syncMenu();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('focusout', this.onFocusOut);
    this.menuMutations?.disconnect();
    this.bindInvoker(null);
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('anchor')) this.syncMenu();
  }

  /** The menu's items, in order. */
  get items(): HTMLElement[] {
    const panel = this.panel;
    return panel ? Array.from(panel.querySelectorAll<HTMLElement>(ITEMS)) : [];
  }

  /** Gives the panel, its items and its button their roles, and listens to the button. */
  private syncMenu() {
    const panel = this.panel;
    if (!panel) return;
    setIfMissing(panel, 'role', 'menu');
    for (const item of this.items) {
      setIfMissing(item, 'role', 'menuitem');
      setIfMissing(item, 'tabindex', '-1');
    }

    const invoker = this.anchorElement;
    this.bindInvoker(invoker);
    if (invoker) setIfMissing(invoker, 'aria-haspopup', 'menu');
    if (!panel.hasAttribute('aria-label') && !panel.hasAttribute('aria-labelledby')) {
      if (invoker?.id) panel.setAttribute('aria-labelledby', invoker.id);
      else warnInDevelopment(this, 'has a menu with no name: give its button an id.');
    }
  }

  private bindInvoker(invoker: Element | null) {
    if (invoker === this.invoker) return;
    this.invoker?.removeEventListener('keydown', this.onInvokerKeyDown as EventListener);
    this.invoker = invoker;
    invoker?.addEventListener('keydown', this.onInvokerKeyDown as EventListener);
  }

  /** The menu opened: focus goes to its first item, or its last one for ArrowUp. */
  protected override panelToggled(open: boolean): void {
    if (!open) return;
    if (this.openToLast) this.roving.focusLast();
    else this.roving.focusFirst();
    this.openToLast = false;
  }

  /** ArrowDown and ArrowUp on the button open the menu, at its first or last item. */
  private onInvokerKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (this.panel?.matches(':popover-open')) {
      if (event.key === 'ArrowUp') this.roving.focusLast();
      else this.roving.focusFirst();
      return;
    }
    this.openToLast = event.key === 'ArrowUp';
    this.panel?.showPopover();
  };

  private ownItem(event: Event): HTMLElement | undefined {
    const item = (event.target as Element).closest?.<HTMLElement>(ITEMS.replace(':scope > ', ''));
    return item && this.items.includes(item) ? item : undefined;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const item = this.ownItem(event);
    if (!item) return;
    // Space picks a menu item: a button does so on its own, a link only on Enter.
    if (event.key === ' ' && item.localName === 'a') {
      event.preventDefault();
      item.click();
      return;
    }
    this.roving.handleKeyDown(event, item);
  };

  /** A click, or Enter and Space on a button, picks the item. */
  private onClick = (event: MouseEvent) => {
    const item = this.ownItem(event);
    if (!item) return;
    if ((item as HTMLButtonElement).disabled || item.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    const value = item.getAttribute('value') ?? item.textContent?.trim() ?? '';
    dispatch<GuiActionEventDetail>(this, 'gui-action', { value, item });
    // Closing with the focus inside returns it to the button.
    this.panel?.hidePopover();
  };

  /** Tab out of the menu closes it, and the focus goes on where Tab took it. */
  private onFocusOut = (event: FocusEvent) => {
    const panel = this.panel;
    const to = event.relatedTarget as Node | null;
    if (!panel?.matches(':popover-open') || !to || panel.contains(to)) return;
    panel.hidePopover();
  };
}

/** The events `gui-menu` fires, with their types. */
export const GuiMenuEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
  'gui-action': fires<CustomEvent<GuiActionEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-menu': GuiMenu;
  }
}

safeDefine('gui-menu', GuiMenu);
