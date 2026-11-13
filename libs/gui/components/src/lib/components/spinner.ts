import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { spinnerIcon } from '../utils/icons';

/**
 * An indeterminate spinner, for a wait of unknown length, such as results loading.
 *
 * ```html
 * <section aria-busy="true">
 *   <gui-spinner label="Loading results"></gui-spinner>
 * </section>
 * ```
 *
 * The glyph is decorative. The `label` goes in a status region, hidden on screen, so screen
 * readers announce it when it changes. Most of them announce nothing when the spinner is added to
 * the page with its label already set: to announce the start of a wait, render the spinner first
 * and set its label then, or announce it another way. Without a label the spinner says nothing.
 * Mark what is loading with `aria-busy` while it loads.
 *
 * It takes the text color, and its size from `--gui-spinner-size` (1.25em).
 */
export class GuiSpinner extends LitElement {
  /** What the wait is for, read out by screen readers. Without one the spinner is decorative. */
  @property({ type: String }) label: string | undefined = undefined;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`<span class="gui-spinner__icon">${spinnerIcon()}</span
      ><span class="gui-spinner__status gui-visually-hidden" role="status"
        >${this.label ?? ''}</span
      >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-spinner': GuiSpinner;
  }
}

safeDefine('gui-spinner', GuiSpinner);
