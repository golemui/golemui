import { ReactiveElement } from 'lit';
import { safeDefine } from '@golemui/lit-utils';
import { warnInDevelopment } from '../utils/dev';
import { dispatch, fires, type GuiActionEventDetail } from '../utils/events';

/** The items of the trail the user can activate: its buttons and links. */
const ITEMS = 'nav > ol > li > :is(button, a[href])';

/** An item marked as the current location: any `aria-current` but `false`. */
const CURRENT = 'nav > ol > li > [aria-current]:not([aria-current="false"])';

/**
 * A breadcrumb trail: the app renders a named `<nav>` with an `<ol>` inside, and the element styles
 * it and reports which item the user picked.
 *
 * ```html
 * <gui-breadcrumb>
 *   <nav aria-label="Breadcrumb">
 *     <ol>
 *       <li><button type="button" value="orders">Orders</button></li>
 *       <li><button type="button" value="2026">2026</button></li>
 *       <li><span aria-current="page">A-1042</span></li>
 *     </ol>
 *   </nav>
 * </gui-breadcrumb>
 * ```
 *
 * Each item is a button, a link or, for the current location, plain text with
 * `aria-current="page"`. Activating a button or a link fires `gui-action`; a link still follows
 * its `href`. The separators between items are drawn in CSS, so screen readers don't read them, and
 * point the other way right to left. A trail longer than its container wraps.
 *
 * The element writes no attribute on itself or on the app's markup. It warns in development when
 * the `<nav>` has no name, or when no item is marked with `aria-current`. The `breadcrumb` message
 * is the English name for the `<nav>`, for a framework binding to translate.
 *
 * @fires gui-action - The user activated an item. `detail.value` is its `value` (or its text),
 *   and `detail.item` the item.
 */
export class GuiBreadcrumb extends ReactiveElement {
  private mutations?: MutationObserver;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.onClick);
    // The app renders, or re-renders, the trail after the element connects.
    this.mutations = new MutationObserver(() => this.check());
    this.mutations.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-current'],
    });
    this.check();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
    this.mutations?.disconnect();
  }

  /** The trail's buttons and links, in order. */
  get items(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(`:scope > ${ITEMS}`));
  }

  /** Warns about the markup a breadcrumb needs and the app left out, once it has rendered any. */
  private check() {
    const nav = this.querySelector(':scope > nav');
    if (!nav) {
      if (this.children.length > 0) {
        warnInDevelopment(this, 'has no <nav> child: render the trail as <nav><ol><li>.');
      }
      return;
    }
    if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
      warnInDevelopment(this, 'has a <nav> with no aria-label, so the trail has no name.');
    }
    if (nav.querySelector(':scope > ol > li') && !this.querySelector(`:scope > ${CURRENT}`)) {
      warnInDevelopment(this, 'has no item with aria-current="page" for the current location.');
    }
  }

  private onClick = (event: MouseEvent) => {
    const item = (event.target as Element).closest?.<HTMLElement>(':is(button, a[href])');
    if (!item || !this.items.includes(item)) return;
    if ((item as HTMLButtonElement).disabled || item.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    const value = item.getAttribute('value') ?? item.textContent?.trim() ?? '';
    dispatch<GuiActionEventDetail>(this, 'gui-action', { value, item });
  };
}

/** The events `gui-breadcrumb` fires, with their types. */
export const GuiBreadcrumbEvents = {
  'gui-action': fires<CustomEvent<GuiActionEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-breadcrumb': GuiBreadcrumb;
  }
}

safeDefine('gui-breadcrumb', GuiBreadcrumb);
