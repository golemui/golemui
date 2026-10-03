import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GuiTabsPart } from './tab-part';

/**
 * A tab of a `gui-tabs`. Its content is its label.
 */
export class GuiTab extends GuiTabsPart {
  protected readonly partRole = 'tab';
  /** The `name` of the `gui-tab-panel` the tab shows. */
  @property({ type: String, reflect: true }) panel: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-tab': GuiTab;
  }
}

safeDefine('gui-tab', GuiTab);
