import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { fires } from '../utils/events';

/** The detail of `gui-toggle`: whether the item is now open. */
export type GuiToggleEventDetail = { open: boolean };

/**
 * An item of a `gui-accordion`: a `<details>` the app renders, with its `<summary>` as the header
 * and the rest as the content. The item keeps the details' open state in `open`. The stylesheet
 * draws the arrow at the end of the summary, so the item adds nothing to the app's markup.
 *
 * ```html
 * <gui-accordion-item>
 *   <details>
 *     <summary>Personal</summary>
 *     <div>…</div>
 *   </details>
 * </gui-accordion-item>
 * ```
 *
 * @fires gui-toggle - The user opened or closed the item, or its accordion closed it because the
 *   user opened another. `detail.open` is the new state.
 */
export class GuiAccordionItem extends ReactiveElement {
  /**
   * Whether the item is open. Without a value it takes the details' own `open`. Setting it fires no
   * `gui-toggle`.
   */
  @property({ converter: booleanAttribute, reflect: true }) open: boolean | undefined = undefined;

  private mutations?: MutationObserver;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The toggle event does not bubble: a capturing listener sees the details'.
    this.addEventListener('toggle', this.onToggle, true);
    // The app can render, or re-render, the details after the item connects.
    this.mutations = new MutationObserver((records) => {
      const changed = records.some((record) => {
        const target = record.target as Element;
        return target === this || target.localName === 'details';
      });
      if (changed) this.sync();
    });
    this.mutations.observe(this, { childList: true, subtree: true });
    this.sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('toggle', this.onToggle, true);
    this.mutations?.disconnect();
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('open')) this.sync();
  }

  private get details(): HTMLDetailsElement | null {
    return this.querySelector(':scope > details');
  }

  /** Brings the details in line with `open`. */
  private sync() {
    const details = this.details;
    if (!details) return;

    if (this.open === undefined) this.open = details.open;
    else if (details.open !== this.open) details.open = this.open;
  }

  /** The details toggled: by the user, when it no longer matches `open`. */
  private onToggle = (event: Event) => {
    const details = this.details;
    if (!details || event.target !== details || details.open === this.open) return;
    this.open = details.open;
    this.dispatchEvent(
      new CustomEvent<GuiToggleEventDetail>('gui-toggle', {
        detail: { open: details.open },
        bubbles: true,
        composed: true,
      }),
    );
  };
}

/** The events `gui-accordion-item` fires, with their types. */
export const GuiAccordionItemEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-accordion-item': GuiAccordionItem;
  }
}

safeDefine('gui-accordion-item', GuiAccordionItem);
