import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { GuiList } from './list';
import type { OptionValue } from '@golemui/gui-shared/internals';

/**
 * Multi-select listbox. Same virtualization, keyboard navigation and focus
 * model as `gui-list`, but selection is an array (`values`) and every
 * Enter/Space/click `change` event is a per-item toggle signal — the host
 * owns the array toggle semantics.
 */
export class GuiMultiList extends GuiList {
  @property({ type: Array }) values: OptionValue[] | undefined = [];

  protected override hasSelection(): boolean {
    return !!this.values?.length;
  }

  protected override isSelected(value: OptionValue): boolean {
    return !!this.values?.includes(value);
  }

  protected override syncHostAria() {
    super.syncHostAria();
    this.setAttribute('aria-multiselectable', 'true');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-list': GuiMultiList;
  }
}

safeDefine('gui-multi-list', GuiMultiList);
