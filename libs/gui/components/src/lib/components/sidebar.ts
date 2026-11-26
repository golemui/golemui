import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { warnInDevelopment } from '../utils/dev';
import { dispatch, fires } from '../utils/events';

/** The side of the layout the side region sits on. Start and end follow the reading direction. */
export type GuiSidebarSide = 'start' | 'end';

/** The width of the side region while it is a column. */
export type GuiSidebarSideSize = 'sm' | 'md' | 'lg';

/** The detail of `gui-collapse`: whether the side region is now collapsed into the drawer. */
export type GuiCollapseEventDetail = { collapsed: boolean };

/** What can take focus in a copy of the side region, visible or not. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const canFocus = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  !(element as HTMLButtonElement).disabled &&
  element.tabIndex >= 0 &&
  element.checkVisibility();

/**
 * An app layout with a side region, such as a navigation menu, next to the main one. The app
 * writes the two regions, a toggle, and the drawer the toggle opens, which is a `gui-dialog`
 * holding a second copy of the side region.
 *
 * ```html
 * <gui-sidebar side="start" side-size="md">
 *   <button type="button" class="gui-sidebar__toggle" commandfor="nav-drawer"
 *     command="show-modal" aria-label="Open menu"></button>
 *   <aside class="gui-sidebar__side" aria-label="Main">…</aside>
 *   <div class="gui-sidebar__main">…</div>
 * </gui-sidebar>
 * <gui-dialog placement="start">
 *   <dialog id="nav-drawer" aria-label="Main">…the side region again…</dialog>
 * </gui-dialog>
 * ```
 *
 * The layout follows the element's own width, not the viewport's, so it fits wherever it is put:
 *
 * - From 768px wide, the side region is a column, sticky, that scrolls on its own when it is
 *   taller than the viewport. The toggle is hidden.
 * - Below 768px, the side region is hidden, and the toggle shows above the main region. The app's
 *   drawer holds the side region instead.
 *
 * CSS switches between them, so the server render already has the right layout. The element
 * reflects `collapsed` and fires `gui-collapse` when the layout switches. It then closes the
 * drawer when the element grows past the threshold, and keeps focus visible: focus in the side
 * column goes to the toggle when the column hides, and focus in the drawer goes to the same
 * control in the column when the drawer closes. The two copies must render the same controls in
 * the same order for that.
 *
 * The element writes nothing else on itself or the app's markup. It warns in development when the
 * toggle, the side region's name or the drawer is missing. The `openSidebar` message ("Open menu")
 * is the English name for the toggle, for a framework binding to translate.
 *
 * @cssprop --gui-sidebar-side-size - The width of the side column. `side-size` sets it to 12rem,
 *   16rem (the default) or 20rem.
 * @fires gui-collapse - The side region collapsed into the drawer, or came back as a column.
 *   `detail.collapsed` is the new state.
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
    this.focusedInColumn = null;
    this.measured = undefined;
  }

  private onFocusIn = (event: FocusEvent) => {
    const target = event.target as Element;
    this.focusedInColumn = this.sideRegion?.contains(target) ? target : null;
  };

  // Focus that left for somewhere else is no longer the column's. Focus the browser drops has
  // nowhere to go, and stays the column's until the resize is reported.
  private onFocusOut = (event: FocusEvent) => {
    const to = event.relatedTarget as Element | null;
    if (to && !this.sideRegion?.contains(to)) this.focusedInColumn = null;
  };

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

  /** The app's drawer: the `<dialog>` the toggle opens. */
  private get drawer(): HTMLDialogElement | null {
    const id =
      this.toggle?.getAttribute('commandfor') ?? this.toggle?.getAttribute('aria-controls');
    const root = this.getRootNode() as Document | ShadowRoot;
    const drawer = id ? root.getElementById?.(id) : null;
    return drawer instanceof HTMLDialogElement ? drawer : null;
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
    const toggle = this.toggle;
    if (!toggle) {
      warnInDevelopment(this, 'has no .gui-sidebar__toggle, so a narrow layout hides the side.');
    } else if (!this.drawer) {
      warnInDevelopment(
        this,
        'has a toggle whose commandfor names no <dialog>: give it the id of the drawer.',
      );
    }
  }

  /**
   * Follows the layout the stylesheet chose, and keeps focus where the user can see it. What it
   * does depends on the layout now, not on a change, so it holds whenever the report comes; only
   * the event waits for a change from the first report.
   */
  private sync() {
    const collapsed = this.collapsedByStyle;
    this.toggleAttribute('collapsed', collapsed);

    if (collapsed) {
      const active = document.activeElement;
      const lost = !active || active === document.body;
      if (this.sideRegion?.contains(active) || (lost && this.focusedInColumn)) {
        this.toggle?.focus();
      }
      this.focusedInColumn = null;
    } else {
      this.closeDrawer();
    }

    const changed = this.measured !== undefined && collapsed !== this.measured;
    this.measured = collapsed;
    if (changed) dispatch<GuiCollapseEventDetail>(this, 'gui-collapse', { collapsed });
  }

  /** Closes the drawer, which only a narrow layout shows, moving focus into the side column. */
  private closeDrawer() {
    const drawer = this.drawer;
    if (!drawer?.open) return;
    const target = this.matchInColumn(drawer, document.activeElement);
    drawer.close();
    target?.focus();
  }

  /**
   * The control of the side column that matches the one focused in the drawer: the one at the same
   * place, or the nearest focusable one before it (in a group the column has closed), or the
   * column's first.
   */
  private matchInColumn(drawer: HTMLDialogElement, focused: Element | null): HTMLElement | null {
    const side = this.sideRegion;
    if (!side || !focused || !drawer.contains(focused)) return null;
    const inDrawer = Array.from(drawer.querySelectorAll(FOCUSABLE));
    const inColumn = Array.from(side.querySelectorAll(FOCUSABLE));
    const index = inDrawer.indexOf(focused);
    for (let i = Math.min(index, inColumn.length - 1); i >= 0; i--) {
      if (canFocus(inColumn[i])) return inColumn[i] as HTMLElement;
    }
    return inColumn.find(canFocus) ?? null;
  }
}

/** The events `gui-sidebar` fires, with their types. */
export const GuiSidebarEvents = {
  'gui-collapse': fires<CustomEvent<GuiCollapseEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-sidebar': GuiSidebar;
  }
}

safeDefine('gui-sidebar', GuiSidebar);
