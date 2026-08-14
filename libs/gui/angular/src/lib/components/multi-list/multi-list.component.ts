import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  type ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { type AngularItemRenderer, InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { ListItem, MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
import { DefaultMultiListItemRenderer } from './default-multi-list.item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/errors';

@Component({
  standalone: true,
  selector: 'gui-multi-list-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-list.component.html',
  host: {
    class: 'gui-multi-list-widget gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiListComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<OptionValue[]>;

  protected adapter: InputWidgetAdapter<OptionValue[], MultiListProps<unknown>> =
    inject(InputWidgetAdapter);

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultMultiListItemRenderer;

  protected listElementRef = viewChild.required<ElementRef>('listRef');

  protected currentRange = signal({ start: 0, end: 10 });
  protected listItems = signal<ListItem<any>[]>([]);
  protected focusedIndex = signal<number>(-1);

  protected visibleItems = computed(() => {
    const items = this.listItems() || [];
    const { start, end } = this.currentRange();

    return items.slice(start, end);
  });

  protected currentValues = computed(() => {
    const value = this.adapter.templateData().value;
    return Array.isArray(value) ? value : [];
  });

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected toggleValue(value: OptionValue) {
    const templateData = this.adapter.templateData();
    if (templateData.disabled || templateData.readonly) return;

    const current = this.currentValues();
    if (current.includes(value)) {
      this.adapter.valueChanged(current.filter((v) => v !== value));
      return;
    }
    if (templateData.limit !== undefined && current.length >= templateData.limit) return;
    this.adapter.valueChanged([...current, value]);
  }

  protected onClickItem(item: any, index: number, listRef: any) {
    if (this.adapter.templateData().disabled || item.disabled) return;

    this.toggleValue(item.value);
    this.focusedIndex.set(index);
    listRef.focusItemAtIndex(index);
  }

  protected valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.toggleValue(value);
  }

  protected onFocusChange(event: Event) {
    const index = (event as CustomEvent).detail.index;
    this.focusedIndex.set(index);
  }

  protected onUpdateItems(event: Event) {
    const items = (event as CustomEvent).detail;
    this.listItems.set(items ? [...items] : []);
  }

  protected onRangeChange(event: Event) {
    const { startIndex, endIndex } = (event as CustomEvent).detail;
    this.currentRange.set({ start: startIndex, end: endIndex });
  }
}
