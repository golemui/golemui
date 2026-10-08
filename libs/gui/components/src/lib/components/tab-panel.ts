import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GuiTabsPart } from './tab-part';

/**
 * A panel of a `gui-tabs`, shown while its tab is selected. `gui-tabs` only hides it: rendering its
 * content, or leaving an inactive panel out, is up to the app.
 */
export class GuiTabPanel extends GuiTabsPart {
  protected readonly partRole = 'tabpanel';
  /** The name the panel's `gui-tab` points to with its `panel`. */
  @property({ type: String, reflect: true }) name: string | undefined = undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-tab-panel': GuiTabPanel;
  }
}

safeDefine('gui-tab-panel', GuiTabPanel);
