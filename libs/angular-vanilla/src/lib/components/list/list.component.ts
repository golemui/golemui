import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
  signal,
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
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;

  protected adapter: Angular.ControlFieldAdapter<OptionValue, ListProps<unknown>> = inject(
    Angular.ControlFieldAdapter,
  );

  protected defaultListItemRenderer: Angular.AngularItemRenderer<string> = DefaultListItemRenderer;

  private currentRange = signal({ start: 0, end: 10 });
  private listItems = signal<ListItem<any>[]>([]);

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

  protected valueChanged(event: ListItem<any>) {
    const item = event;
    this.adapter.valueChanged(item.value);
  }

  protected onUpdateItems(event: Event) {
    const items = (event as CustomEvent).detail;
    this.listItems.set([...items]);
  }

  protected onRangeChange(event: Event) {
    const { startIndex, endIndex } = (event as CustomEvent).detail;
    this.currentRange.set({ start: startIndex, end: endIndex });
  }
}
