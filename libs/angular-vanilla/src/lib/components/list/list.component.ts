import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { ListItem, ListProps, OptionValue } from '@golemui/shared-vanilla';
import { DefaultListItemRenderer } from './default-list.item-renderer';

@Component({
  standalone: true,
  selector: 'gui-list-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './list.component.html',
  host: {
    class: 'gui-list',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;

  protected adapter: Angular.ControlFieldAdapter<OptionValue, ListProps<unknown>> = inject(
    Angular.ControlFieldAdapter,
  );

  protected defaultListItemRenderer: Angular.AngularItemRenderer<string> = DefaultListItemRenderer;

  protected listElementRef = viewChild.required<ElementRef>('listRef');

  protected currentRange = signal({ start: 0, end: 10 });
  protected listItems = signal<ListItem<any>[]>([]);
  protected focusedIndex = signal<number>(-1);

  protected visibleItems = computed(() => {
    const items = this.listItems() || [];
    const { start, end } = this.currentRange();

    return items.slice(start, end);
  });

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected onClickItem(item: any, index: number, listRef: any) {
    if (this.adapter.templateData().disabled) return;

    this.setValue(item.value);
    this.focusedIndex.set(index);
    listRef.focusItemAtIndex(index);
  }

  protected valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.setValue(value);
  }

  protected setValue(value: OptionValue) {
    this.adapter.valueChanged(value);
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
