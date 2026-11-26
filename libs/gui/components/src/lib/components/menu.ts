import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { warnInDevelopment } from '../utils/dev';
import {
  dispatch,
  fires,
  stopPropagation,
  type GuiActionEventDetail,
  type GuiToggleEventDetail,
} from '../utils/events';
// A horizontal menu's dropdowns are `gui-popover`s in the app's markup.
import './popover';

/** The directions a menu can lay out its first level in. */
export type GuiMenuOrientation = 'vertical' | 'horizontal';

/** The detail of a menu's `gui-toggle`: a group opened or closed, and which one. */
export type GuiMenuToggleEventDetail = GuiToggleEventDetail & { value: string };

/** What the user can activate: a button or a link. */
const ACTIVATABLE = ':is(button, a[href])';

/** A group's button that opens its list in place: the disclosure pattern. */
const isDisclosure = (item: Element): boolean =>
  item.localName === 'button' &&
  item.hasAttribute('aria-expanded') &&
  item.hasAttribute('aria-controls');

/** An item's value: its `value` attribute, or its text. */
const valueOf = (item: Element): string =>
  item.getAttribute('value') ?? item.textContent?.trim() ?? '';

/**
 * A navigation menu: the app renders a named `<nav>` with a list of buttons and links, and
 * groups that open. It follows the disclosure navigation pattern, so the buttons and links keep
 * their roles and their place in the Tab order (`role="menu"` is for menus of actions, as in
 * `gui-menu-button`).
 *
 * ```html
 * <gui-menu>
 *   <nav aria-label="Main">
 *     <ul>
 *       <li><button type="button" value="orders" aria-current="page">Orders</button></li>
 *       <li>
 *         <button type="button" aria-expanded="false" aria-controls="m-settings">Settings</button>
 *         <ul id="m-settings" hidden>
 *           <li><button type="button" value="profile">Profile</button></li>
 *           <li><button type="button" value="billing">Billing</button></li>
 *         </ul>
 *       </li>
 *     </ul>
 *   </nav>
 * </gui-menu>
 * ```
 *
 * A group is a button with `aria-expanded` and `aria-controls`, next to the list it opens in
 * place, with `hidden` while it is closed. Groups nest to any depth.
 *
 * With `orientation="horizontal"` the first level is a row, which scrolls with a shadow at each
 * edge when it doesn't fit, and a first-level group opens a dropdown instead: its button has a
 * `popovertarget`, and its list is a `[popover]` inside a `gui-popover`, which places it. Groups
 * inside a dropdown open in place.
 *
 * ```html
 * <li>
 *   <button type="button" popovertarget="m-reports">Reports</button>
 *   <gui-popover>
 *     <ul id="m-reports" popover>…</ul>
 *   </gui-popover>
 * </li>
 * ```
 *
 * The element toggles a group's `aria-expanded` and `hidden` when the user opens or closes it, and
 * writes nothing else: the app writes the initial state, and marks the current page with
 * `aria-current="page"`. Escape closes the group that has focus and returns focus to its button.
 * Picking an item in a dropdown closes the dropdown. The element warns in development when the
 * `<nav>` has no name, a group's button controls no list, or the current item starts in a closed
 * group.
 *
 * @fires gui-action - The user activated an item. `detail.value` is its `value` (or its text),
 *   and `detail.item` the item. A link still follows its `href`.
 * @fires gui-toggle - The user opened or closed a group. `detail.open` is its new state, and
 *   `detail.value` its button's `value` (or its text).
 */
export class GuiMenu extends ReactiveElement {
  /** How the first level is laid out: a column, or a row of dropdowns. */
  @property({ reflect: true }) orientation: GuiMenuOrientation | undefined = undefined;

  private mutations?: MutationObserver;
  /** Whether the menu has rendered its items once, which is when its starting state is checked. */
  private checkedStart = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('gui-toggle', this.onDropdownToggle);
    // The app renders, or re-renders, the menu after the element connects.
    this.mutations = new MutationObserver(() => this.check());
    this.mutations.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-controls'],
    });
    this.check();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('gui-toggle', this.onDropdownToggle);
    this.mutations?.disconnect();
  }

  /** The menu's `<nav>`. */
  private get nav(): HTMLElement | null {
    return this.querySelector(':scope > nav');
  }

  /** The list a group's button opens in place, from its `aria-controls`. */
  private listOf(button: Element): HTMLElement | null {
    const id = button.getAttribute('aria-controls');
    if (!id) return null;
    const list = (this.getRootNode() as Document | ShadowRoot).getElementById?.(id) ?? null;
    return list && this.contains(list) ? list : null;
  }

  /** The button or link of this menu an event happened on, if any. */
  private ownItem(event: Event): HTMLElement | undefined {
    const item = (event.target as Element).closest?.<HTMLElement>(ACTIVATABLE);
    const nav = this.nav;
    return item && nav?.contains(item) ? item : undefined;
  }

  /** Warns about the markup a menu needs and the app left out, once it has rendered any. */
  private check() {
    const nav = this.nav;
    if (!nav) {
      if (this.children.length > 0) {
        warnInDevelopment(this, 'has no <nav> child: render the menu as <nav><ul><li>.');
      }
      return;
    }
    if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
      warnInDevelopment(this, 'has a <nav> with no aria-label, so the menu has no name.');
    }
    for (const button of Array.from(nav.querySelectorAll('button[aria-expanded]'))) {
      if (!this.listOf(button)) {
        warnInDevelopment(
          this,
          'has a group button whose aria-controls names no list in the menu, so it opens nothing.',
        );
      }
    }
    if (this.checkedStart || !nav.querySelector('li')) return;
    // Only the starting state: the user may close the group that holds the current item.
    this.checkedStart = true;
    for (const current of Array.from(
      nav.querySelectorAll('[aria-current]:not([aria-current="false"])'),
    )) {
      if (current.closest('ul[hidden]')) {
        warnInDevelopment(
          this,
          'starts with its current item in a closed group: open the group, so the user sees where they are.',
        );
      }
    }
  }

  /** Opens or closes a group in place, as the user asked. */
  private toggleGroup(button: HTMLElement, open: boolean) {
    const list = this.listOf(button);
    if (!list) return;
    button.setAttribute('aria-expanded', String(open));
    list.toggleAttribute('hidden', !open);
    dispatch<GuiMenuToggleEventDetail>(this, 'gui-toggle', { open, value: valueOf(button) });
  }

  private onClick = (event: MouseEvent) => {
    const item = this.ownItem(event);
    if (!item) return;
    if ((item as HTMLButtonElement).disabled || item.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    if (isDisclosure(item)) {
      this.toggleGroup(item, item.getAttribute('aria-expanded') !== 'true');
      return;
    }
    // A dropdown's button: the browser opens it, and its gui-popover reports it.
    if (item.hasAttribute('popovertarget')) return;

    dispatch<GuiActionEventDetail>(this, 'gui-action', { value: valueOf(item), item });
    // The user went somewhere: the dropdown closes, and the browser returns focus to its button.
    const dropdown = item.closest<HTMLElement>('[popover]');
    if (dropdown && this.contains(dropdown) && dropdown.matches(':popover-open')) {
      dropdown.hidePopover();
    }
  };

  /** Escape closes the open group around the focus, or the one whose button has it. */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const nav = this.nav;
    const focused = event.target as Element;
    if (!nav?.contains(focused)) return;

    let node: Element | null = focused;
    while (node && node !== nav) {
      const button = node.matches('li')
        ? node.querySelector(':scope > button[aria-expanded="true"]')
        : null;
      const list = button && isDisclosure(button) ? this.listOf(button) : null;
      if (button && list && (button === focused || list.contains(focused))) {
        // Handled here: a dropdown around the group stays open.
        event.preventDefault();
        event.stopPropagation();
        this.toggleGroup(button as HTMLElement, false);
        (button as HTMLElement).focus();
        return;
      }
      node = node.parentElement;
    }
  };

  /** A dropdown opened or closed: the menu reports it as its own group's toggle. */
  private onDropdownToggle = (event: Event) => {
    const popover = event.target as Element;
    if (popover === this || popover.localName !== 'gui-popover') return;
    stopPropagation(event);
    const id = popover.querySelector(':scope > [popover]')?.id;
    const button = id ? this.querySelector(`[popovertarget="${CSS.escape(id)}"]`) : null;
    const { open } = (event as CustomEvent<GuiToggleEventDetail>).detail;
    dispatch<GuiMenuToggleEventDetail>(this, 'gui-toggle', {
      open,
      value: button ? valueOf(button) : '',
    });
  };
}

/** The events `gui-menu` fires, with their types. */
export const GuiMenuEvents = {
  'gui-action': fires<CustomEvent<GuiActionEventDetail>>(),
  'gui-toggle': fires<CustomEvent<GuiMenuToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-menu': GuiMenu;
  }
}

safeDefine('gui-menu', GuiMenu);
