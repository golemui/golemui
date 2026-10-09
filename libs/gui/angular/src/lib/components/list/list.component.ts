import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
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
import type { GuiVisibleItem } from '@golemui/gui-components';
import type { ListProps, OptionValue } from '@golemui/gui-shared/internals';
import { DefaultListItemRenderer } from './default-list.item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-list-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [InputWidgetAdapter],
  templateUrl: './list.component.html',
  host: {
    class: 'gui-list gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;

  protected adapter: InputWidgetAdapter<OptionValue, ListProps<unknown>> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultListItemRenderer;

  protected listElementRef = viewChild.required<ElementRef>('listRef');

  /** The options to render, as the list reports them. */
  protected visibleItems = signal<GuiVisibleItem<any>[]>([]);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.setValue(value);
  }

  protected setValue(value: OptionValue) {
    this.adapter.valueChanged(value);
  }

  protected onVisibleItemsChange(event: Event) {
    this.visibleItems.set((event as CustomEvent<GuiVisibleItem<any>[]>).detail);
  }
}
