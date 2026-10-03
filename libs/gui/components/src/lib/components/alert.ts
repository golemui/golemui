import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';

/** The intents an alert can show. */
export type GuiAlertVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

/**
 * A message box: its children are the message. It has the `alert` role, which announces changes to
 * its content at once; give it `role="status"` for a message that can wait.
 *
 * ```html
 * <gui-alert variant="warning">Some fields need your attention.</gui-alert>
 * ```
 */
export class GuiAlert extends ReactiveElement {
  /** The intent the alert shows. */
  @property({ type: String, reflect: true }) variant: GuiAlertVariant | undefined = 'default';

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'alert');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-alert': GuiAlert;
  }
}

safeDefine('gui-alert', GuiAlert);
