import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { warnInDevelopment } from '../utils/dev';
import { dispatch, dispatchToggle, fires, type GuiToggleEventDetail } from '../utils/events';

/** The side of the layout the side region sits on. Start and end follow the reading direction. */
export type GuiSidebarSide = 'start' | 'end';

/** The width of the side region while it is a column. */
export type GuiSidebarSideSize = 'sm' | 'md' | 'lg';

/** The detail of `gui-collapse`: whether the side region is now collapsed into the drawer. */
export type GuiCollapseEventDetail = { collapsed: boolean };

/** What can take focus in the side region. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const canFocus = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  !(element as HTMLButtonElement).disabled &&
  element.tabIndex >= 0 &&
  element.checkVisibility();

/**
 * An app layout with a side region, such as a navigation menu, next to the main one. The app
 * writes the side region once, as a popover, with the toggle that opens it.
 *
 * ```html
 * <gui-sidebar side="start" side-size="md">
 *   <button type="button" class="gui-sidebar__toggle" popovertarget="nav"
 *     aria-label="Open menu"></button>
 *   <aside class="gui-sidebar__side" id="nav" popover aria-label="Main">…</aside>
 *   <div class="gui-sidebar__main">…</div>
 * </gui-sidebar>
 * ```
 *
 * The layout follows the element's own width, not the viewport's, so it fits wherever it is put:
 *
 * - From 768px wide, the side region is a column, sticky, that scrolls on its own when it is
 *   taller than the viewport. The toggle is hidden.
 * - Below 768px, the side region is hidden, and the toggle shows above the main region. It opens
 *   the side region itself as a drawer along the edge, in the top layer, over a backdrop.
 *
 * CSS switches between them, so the server render already has the right layout. There is one
 * side region, so its controls keep their state, and their focus, when the layout switches.
 *
 * The drawer is a popover, not a modal dialog: Escape, a click on the backdrop, Tab out of it and
 * picking something in it (a `gui-action`, a link, a `gui-button`) close it, and focus returns to
 * the toggle. Opening it moves focus to its first control. The page behind it doesn't scroll.
 *
 * The element reflects `collapsed`, and fires `gui-collapse` when the layout switches and
 * `gui-toggle` when the drawer opens or closes. Growing past the threshold closes the drawer, and
 * focus stays on the same control in the column; focus in the column goes to the toggle when the
 * column hides. It writes nothing else on itself or the app's markup, and warns in development
 * when the side region has no name, no `popover` or no id the toggle names. The `openSidebar`
 * ("Open menu") and `sidebarSide` ("Menu") messages are the English names of the toggle and the
 * side region, for a framework binding to translate.
 *
 * @cssprop --gui-sidebar-side-size - The width of the side column. `side-size` sets it to 12rem,
 *   16rem (the default) or 20rem.
 * @cssprop --gui-drawer-size - The width of the drawer, within the viewport less 3rem.
 * @fires gui-collapse - The side region collapsed into the drawer, or came back as a column.
 *   `detail.collapsed` is the new state.
 * @fires gui-toggle - The drawer opened or closed. `detail.open` is the new state.
 */
export class GuiSidebar extends ReactiveElement {
  /** The side the side region sits on: `start` (the default) or `end`. */
  @property({ reflect: true }) side: GuiSidebarSide | undefined = undefined;

  /** The width of the side column: `sm`, `md` (the default) or `lg`. */
  @property({ reflect: true, attribute: 'side-size' }) sideSize: GuiSidebarSideSize | undefined =
    undefined;

  private resizes?: ResizeObserver;
  private mutations?: MutationObserver;
  /**
   * The layout the first resize report found, then each one after. Undefined until then: the
   * container query needs a layout, which may not exist yet when the element connects.
   */
  private measured: boolean | undefined = undefined;
  /**
   * The control last focused in the side column. Chrome moves focus to the page as soon as the
   * column hides, before the resize is reported, so the element can't ask where focus is then.
   */
  private focusedInColumn: Element | null = null;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The server render can't know the width: `collapsed` waits for the first resize report,
    // which comes after hydration.
    this.resizes = new ResizeObserver(() => this.sync());
    this.resizes.observe(this);
    this.addEventListener('focusin', this.onFocusIn);
    this.addEventListener('focusout', this.onFocusOut);
    // Neither `toggle` event bubbles: a capturing listener sees the side region's.
    this.addEventListener('toggle', this.onToggle, true);
    this.addEventListener('gui-action', this.onPick);
    this.addEventListener('click', this.onPick);
    // The app renders, or re-renders, the regions after the element connects.
    this.mutations = new MutationObserver(() => this.check());
    this.mutations.observe(this, { childList: true });
    this.check();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resizes?.disconnect();
    this.mutations?.disconnect();
    this.removeEventListener('focusin', this.onFocusIn);
    this.removeEventListener('focusout', this.onFocusOut);
    this.removeEventListener('toggle', this.onToggle, true);
    this.removeEventListener('gui-action', this.onPick);
    this.removeEventListener('click', this.onPick);
    this.focusedInColumn = null;
    this.measured = undefined;
  }

  /** Whether the side region is collapsed into the drawer: the element is under 768px wide. */
  get collapsed(): boolean {
    return this.hasAttribute('collapsed');
  }

  private get toggle(): HTMLElement | null {
    return this.querySelector(':scope > .gui-sidebar__toggle');
  }

  private get sideRegion(): HTMLElement | null {
    return this.querySelector(':scope > .gui-sidebar__side');
  }

  /** Whether the side region is open as the drawer. */
  private get drawerOpen(): boolean {
    try {
      return !!this.sideRegion?.matches(':popover-open');
    } catch {
      // A browser, or a DOM, without the Popover API never opens one.
      return false;
    }
  }

  /** Whether the stylesheet collapses the side region now. It sets the property on the children. */
  private get collapsedByStyle(): boolean {
    const child = this.firstElementChild;
    return (
      !!child && getComputedStyle(child).getPropertyValue('--gui-sidebar-collapsed').trim() === '1'
    );
  }

  /** Warns about the markup a sidebar needs and the app left out, once it has rendered any. */
  private check() {
    const side = this.sideRegion;
    if (!side) return;
    if (!side.hasAttribute('aria-label') && !side.hasAttribute('aria-labelledby')) {
      warnInDevelopment(this, 'has a .gui-sidebar__side with no aria-label, so it has no name.');
    }
    if (!side.hasAttribute('popover')) {
      warnInDevelopment(
        this,
        'has a .gui-sidebar__side with no popover attribute, so a narrow layout never shows it.',
      );
    }
    const toggle = this.toggle;
    if (!toggle) {
      warnInDevelopment(this, 'has no .gui-sidebar__toggle, so a narrow layout hides the side.');
    } else if (!side.id || toggle.getAttribute('popovertarget') !== side.id) {
      warnInDevelopment(
        this,
        'has a toggle whose popovertarget is not the id of the .gui-sidebar__side.',
      );
    }
  }

  /** Follows the layout the stylesheet chose: `collapsed`, and the event from the first report on. */
  private sync() {
    const collapsed = this.collapsedByStyle;
    this.toggleAttribute('collapsed', collapsed);
    // In the next frame: closing the drawer changes this element's layout, which a resize
    // report must not do while the browser is delivering it.
    requestAnimationFrame(() => this.followLayout(collapsed));

    const changed = this.measured !== undefined && collapsed !== this.measured;
    this.measured = collapsed;
    if (changed) dispatch<GuiCollapseEventDetail>(this, 'gui-collapse', { collapsed });
  }

  /**
   * Keeps the drawer and focus in line with the layout. It depends on the layout now, not on a
   * change, so it holds whenever the report comes.
   */
  private followLayout(collapsed: boolean) {
    if (!this.isConnected || collapsed !== this.collapsedByStyle) return;
    if (collapsed) {
      // Focus in the column, which just hid, goes to the toggle.
      const active = document.activeElement;
      const lost = !active || active === document.body;
      if (
        !this.drawerOpen &&
        (this.sideRegion?.contains(active) || (lost && this.focusedInColumn))
      ) {
        this.toggle?.focus();
      }
      this.focusedInColumn = null;
    } else if (this.drawerOpen) {
      // The drawer becomes the column again: the same controls, so focus stays where it is.
      const active = document.activeElement;
      const keep = this.sideRegion?.contains(active) ? (active as HTMLElement) : null;
      this.sideRegion?.hidePopover();
      if (keep && document.activeElement !== keep) keep.focus();
    }
  }

  private onFocusIn = (event: FocusEvent) => {
    const target = event.target as Element;
    this.focusedInColumn = !this.drawerOpen && this.sideRegion?.contains(target) ? target : null;
  };

  // Focus that left for somewhere else is no longer the column's: focus the browser drops has
  // nowhere to go, and stays the column's until the resize is reported. And Tab out of the open
  // drawer closes it: the page behind it is not inert.
  private onFocusOut = (event: FocusEvent) => {
    const side = this.sideRegion;
    const to = event.relatedTarget as Element | null;
    if (!to || side?.contains(to)) return;
    this.focusedInColumn = null;
    if (this.drawerOpen) side?.hidePopover();
  };

  /** The drawer opened or closed. Opening moves focus to its first control, as a dialog does. */
  private onToggle = (event: Event) => {
    const side = this.sideRegion;
    if (!side || event.target !== side) return;
    const open = (event as ToggleEvent).newState === 'open';
    if (open && !side.contains(document.activeElement)) {
      Array.from(side.querySelectorAll(FOCUSABLE)).find(canFocus)?.focus();
    }
    dispatchToggle(this, open);
  };

  /** Picking something in the drawer closes it: a GolemUI action, a link or a `gui-button`. */
  private onPick = (event: Event) => {
    const side = this.sideRegion;
    const target = event.target as Element;
    if (!this.drawerOpen || !side?.contains(target)) return;
    const picked =
      event.type === 'gui-action' ||
      (event.type === 'click' && !!target.closest?.('a[href], gui-button'));
    if (picked) side.hidePopover();
  };
}

/** The events `gui-sidebar` fires, with their types. */
export const GuiSidebarEvents = {
  'gui-collapse': fires<CustomEvent<GuiCollapseEventDetail>>(),
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-sidebar': GuiSidebar;
  }
}

safeDefine('gui-sidebar', GuiSidebar);
