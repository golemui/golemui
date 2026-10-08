import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { fires } from '../utils/events';
import type { GuiAccordionItem, GuiToggleEventDetail } from './accordion-item';
import './accordion-item';

/**
 * An accordion of `gui-accordion-item`s. Opening an item closes the others, unless `multiple` is
 * set.
 *
 * ```html
 * <gui-accordion>
 *   <gui-accordion-item>
 *     <details open>
 *       <summary>Personal</summary>
 *       <div>…</div>
 *     </details>
 *   </gui-accordion-item>
 *   <gui-accordion-item>
 *     <details>
 *       <summary>Billing</summary>
 *       <div>…</div>
 *     </details>
 *   </gui-accordion-item>
 * </gui-accordion>
 * ```
 *
 * @fires gui-toggle - An item opened or closed: the event's target is the item, and `detail.open`
 *   its new state. The items an opening closes fire theirs after the opened item's.
 */
export class GuiAccordion extends ReactiveElement {
  /** Lets several items be open at once. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('gui-toggle', this.onToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('gui-toggle', this.onToggle);
  }

  /** The items of this accordion, leaving out those of accordions nested in them. */
  private get items(): GuiAccordionItem[] {
    return Array.from(this.querySelectorAll('gui-accordion-item')).filter(
      (item) => item.closest('gui-accordion') === this,
    );
  }

  private onToggle = (event: Event) => {
    const opened = event.target as GuiAccordionItem;
    const { open } = (event as CustomEvent<GuiToggleEventDetail>).detail;
    if (this.multiple || !open || !this.items.includes(opened)) return;

    const closed = this.items.filter((item) => item !== opened && item.open);
    for (const item of closed) item.open = false;
    // After the opened item's event has reached the page, so a listener sees it first.
    queueMicrotask(() => {
      for (const item of closed) {
        item.dispatchEvent(
          new CustomEvent<GuiToggleEventDetail>('gui-toggle', {
            detail: { open: false },
            bubbles: true,
            composed: true,
          }),
        );
      }
    });
  };
}

/** The events `gui-accordion` fires, from its items, with their types. */
export const GuiAccordionEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-accordion': GuiAccordion;
  }
}

safeDefine('gui-accordion', GuiAccordion);
