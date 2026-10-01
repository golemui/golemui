import { safeDefine } from '@golemui/lit-utils';
import { GuiTabsPart } from './tab-part';

/**
 * The strip of `gui-tab`s of a `gui-tabs`. It scrolls when the tabs do not fit. Name it with
 * `aria-label` when the page has several tab sets.
 */
export class GuiTabList extends GuiTabsPart {
  protected readonly partRole = 'tablist';
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-tab-list': GuiTabList;
  }
}

safeDefine('gui-tab-list', GuiTabList);
