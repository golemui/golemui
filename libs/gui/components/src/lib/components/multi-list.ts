import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GuiList } from './list';
import type { GuiVisibleItem, ListItem, OptionValue } from '../types';
import { dispatch, dispatchValue, fires, valueEvents } from '../utils/events';

/**
 * Multi-select listbox. Same virtualization, keyboard navigation and focus
 * model as `gui-list`, but selection is an array (`values`): every
 * Enter/Space/click adds the item's value to `values` or removes it.
 *
 * @fires gui-item-toggle - The user toggled an item. `detail.value` is its value.
 * @fires gui-input - The user toggled an item. `detail.value` is the new `values`.
 * @fires gui-change - The user toggled an item. `detail.value` is the new `values`.
 */
export class GuiMultiList extends GuiList {
  /** The selected values. */
  @property({ type: Array }) values: OptionValue[] | undefined = [];

  protected override hasSelection(): boolean {
    return !!this.values?.length;
  }

  protected override isSelected(value: OptionValue): boolean {
    return !!this.values?.includes(value);
  }

  protected override get controlValue(): unknown {
    return this.values;
  }

  protected override set controlValue(values: unknown) {
    this.values = values as OptionValue[] | undefined;
  }

  protected override selectItem(item: ListItem<unknown>) {
    const values = this.values ?? [];
    const value = item.value as OptionValue;
    this.values = values.includes(value)
      ? values.filter((current) => current !== value)
      : [...values, value];
    dispatch(this, 'gui-item-toggle', { value: item.value });
    dispatchValue(this, this.values);
  }

  protected override syncHostAria() {
    super.syncHostAria();
    this.setAttribute('aria-multiselectable', 'true');
  }
}

/** The events `gui-multi-list` fires, with their types. */
export const GuiMultiListEvents = {
  ...valueEvents<GuiMultiList['values']>(),
  'gui-focus-change': fires<CustomEvent<{ index: number }>>(),
  'gui-range-change': fires<CustomEvent<{ startIndex: number; endIndex: number }>>(),
  'gui-update-items': fires<CustomEvent<ListItem<unknown>[]>>(),
  'gui-visible-items-change': fires<CustomEvent<GuiVisibleItem[]>>(),
  'gui-item-toggle': fires<CustomEvent<{ value: OptionValue }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-list': GuiMultiList;
  }
}

safeDefine('gui-multi-list', GuiMultiList);
