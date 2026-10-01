import { ReactiveElement, render, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { fires } from '../utils/events';
import { caretDownIcon } from '../utils/icons';

/** The detail of `gui-toggle`: whether the item is now open. */
export type GuiToggleEventDetail = { open: boolean };

/** The caret at the end of a summary, in a span of the item's own: the summary is the app's. */
function createArrow(): HTMLSpanElement {
  const arrow = document.createElement('span');
  arrow.className = 'gui-accordion__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  render(caretDownIcon(), arrow);
  return arrow;
}

/**
 * An item of a `gui-accordion`: a `<details>` the app renders, with its `<summary>` as the header
 * and the rest as the content. The item keeps the details' open state in `open`, and adds the
 * arrow at the end of the summary.
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
  @property({ type: Boolean, reflect: true }) open: boolean | undefined = undefined;

  private mutations?: MutationObserver;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The toggle event does not bubble: a capturing listener sees the details'.
    this.addEventListener('toggle', this.onToggle, true);
    // The app can render, or re-render, the details and its summary after the item connects. A
    // framework that sets a summary's text with textContent also removes the arrow.
    this.mutations = new MutationObserver((records) => {
      const changed = records.some((record) => {
        const target = record.target as Element;
        return target === this || target.localName === 'details' || target.localName === 'summary';
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

  /** Brings the details in line with `open`, and gives its summary the arrow. */
  private sync() {
    const details = this.details;
    if (!details) return;

    if (this.open === undefined) this.open = details.open;
    else if (details.open !== this.open) details.open = this.open;

    const summary = details.querySelector(':scope > summary');
    if (summary && !summary.querySelector(':scope > .gui-accordion__arrow')) {
      summary.append(createArrow());
    }
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
