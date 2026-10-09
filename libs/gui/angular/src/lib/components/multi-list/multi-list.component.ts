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
import type { GuiVisibleItem } from '@golemui/gui-components';
import type { MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
import { DefaultMultiListItemRenderer } from './default-multi-list.item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/errors';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-multi-list-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-list.component.html',
  host: {
    class: 'gui-multi-list-widget gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiListComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<OptionValue[]>;

  protected adapter: InputWidgetAdapter<OptionValue[], MultiListProps<unknown>> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultMultiListItemRenderer;

  protected listElementRef = viewChild.required<ElementRef>('listRef');

  /** The options to render, as the list reports them. */
  protected visibleItems = signal<GuiVisibleItem<any>[]>([]);

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
    this.adapter.valueChanged([...current, value]);
  }

  protected valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.toggleValue(value);
  }

  protected onVisibleItemsChange(event: Event) {
    this.visibleItems.set((event as CustomEvent<GuiVisibleItem<any>[]>).detail);
  }
}
