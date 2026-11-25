import { ReactiveElement } from 'lit';
import { safeDefine } from '@golemui/lit-utils';
import { warnInDevelopment } from '../utils/dev';

/** The attributes the element writes on itself while its table overflows. */
type RegionAttribute = 'tabindex' | 'role' | 'aria-labelledby' | 'aria-label';

/**
 * The scroll region of a data table: the app renders a native `<table>` inside, and the element
 * adds what markup alone can't do.
 *
 * ```html
 * <gui-table>
 *   <table>
 *     <caption>Open orders</caption>
 *     <thead><tr><th scope="col">Order</th><th scope="col">Total</th></tr></thead>
 *     <tbody><tr><td>A-1042</td><td class="gui-table__cell--end">1,280.50</td></tr></tbody>
 *   </table>
 * </gui-table>
 * ```
 *
 * A table wider than its container scrolls inside the element, never the page, with a shadow at
 * each edge that has more to show. While it overflows, the element is a keyboard-focusable
 * region, named after the table's `<caption>` (or its `aria-label`), so a keyboard user can
 * scroll it with the arrow keys. A table that fits adds no tab stop. Those attributes change with
 * the layout, after hydration, and the element leaves any the app wrote itself.
 *
 * Give the table a `<caption>`, or an `aria-label`: the element warns in development when it has
 * neither. Align a cell with `gui-table__cell--start`, `--center` or `--end`, and mark the one
 * cell of a row that says the table is empty with `gui-table__empty`.
 *
 * @cssprop --gui-table-bg - The background the table sits on, which the scroll shadows fade from.
 * @cssprop --gui-table-region-width - Set by the element while the table overflows: the width its
 *   caption keeps as the table scrolls.
 */
export class GuiTable extends ReactiveElement {
  private resizes?: ResizeObserver;
  private mutations?: MutationObserver;
  private observedTable: HTMLTableElement | undefined;
  /** The attributes this element wrote, and so removes when the table fits again. */
  private owned = new Set<RegionAttribute>();

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.resizes = new ResizeObserver(() => this.sync());
    this.resizes.observe(this);
    // The app renders, or re-renders, the table and its caption after the element connects.
    this.mutations = new MutationObserver(() => this.sync());
    this.mutations.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      // What names the region. The element's own writes come back here too, and change nothing.
      attributes: true,
      attributeFilter: ['id', 'aria-label', 'aria-labelledby'],
    });
    this.sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resizes?.disconnect();
    this.mutations?.disconnect();
    this.observedTable = undefined;
  }

  /** The table this element scrolls: its first `<table>` child. */
  private get table(): HTMLTableElement | undefined {
    return Array.from(this.children).find(
      (child): child is HTMLTableElement => child instanceof HTMLTableElement,
    );
  }

  /** Whether the table is wider than the element, so the element scrolls it. */
  private get overflows(): boolean {
    return this.scrollWidth > this.clientWidth + 1;
  }

  private sync() {
    const table = this.table;
    // The table's own size changes with its rows and columns, not only with the element's.
    if (table !== this.observedTable) {
      if (this.observedTable) this.resizes?.unobserve(this.observedTable);
      if (table) this.resizes?.observe(table);
      this.observedTable = table;
    }
    if (!table) return;
    this.warnIfUnnamed(table);
    if (this.overflows) this.becomeRegion(table);
    else this.stopBeingRegion();
  }

  private warnIfUnnamed(table: HTMLTableElement) {
    if (
      table.caption ||
      table.hasAttribute('aria-label') ||
      table.hasAttribute('aria-labelledby')
    ) {
      return;
    }
    warnInDevelopment(
      this,
      'has a table with no <caption> and no aria-label, so the table and its scroll region have no name.',
    );
  }

  /** Makes the element a named, focusable region, writing only what the app didn't. */
  private becomeRegion(table: HTMLTableElement) {
    // Through the CSSOM, which a strict CSP allows: the caption stays this wide as it scrolls.
    this.style.setProperty('--gui-table-region-width', `${this.clientWidth}px`);
    this.own('tabindex', '0');
    this.own('role', 'region');
    if (this.ownsOrLacks('aria-labelledby') && this.ownsOrLacks('aria-label')) {
      const name = this.nameOf(table);
      if (name.id) {
        this.drop('aria-label');
        this.own('aria-labelledby', name.id);
      } else {
        this.drop('aria-labelledby');
        if (name.text) this.own('aria-label', name.text);
        else this.drop('aria-label');
      }
    }
  }

  private stopBeingRegion() {
    for (const attribute of this.owned) this.removeAttribute(attribute);
    this.owned.clear();
    this.style.removeProperty('--gui-table-region-width');
    if (!this.getAttribute('style')) this.removeAttribute('style');
  }

  /**
   * The region's name: the id of the caption or of the table's labelling element when it has
   * one, or the text to use otherwise.
   */
  private nameOf(table: HTMLTableElement): { id?: string; text?: string } {
    const labelledBy = table.getAttribute('aria-labelledby');
    if (labelledBy) return { id: labelledBy };
    const label = table.getAttribute('aria-label');
    if (label) return { text: label };
    if (table.caption?.id) return { id: table.caption.id };
    return { text: table.caption?.textContent?.trim() || undefined };
  }

  /** Whether the app left this attribute to the element: it wrote it, or nobody did. */
  private ownsOrLacks(attribute: RegionAttribute): boolean {
    return this.owned.has(attribute) || !this.hasAttribute(attribute);
  }

  /** Sets an attribute the app didn't write, and remembers it is the element's. */
  private own(attribute: RegionAttribute, value: string) {
    if (!this.ownsOrLacks(attribute)) return;
    if (this.getAttribute(attribute) !== value) this.setAttribute(attribute, value);
    this.owned.add(attribute);
  }

  /** Removes an attribute this element wrote. */
  private drop(attribute: RegionAttribute) {
    if (!this.owned.has(attribute)) return;
    this.removeAttribute(attribute);
    this.owned.delete(attribute);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-table': GuiTable;
  }
}

safeDefine('gui-table', GuiTable);
