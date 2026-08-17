import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { type AngularItemRenderer, InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type {
  ListItem,
  ListProps,
  MultiDropdownProps,
  OptionValue,
} from '@golemui/gui-shared/internals';
import { updateListItems } from '@golemui/gui-components/internals';
import { debounceTime, Subject, type Subscription } from 'rxjs';
import { DefaultMultiListItemRenderer } from '../multi-list/default-multi-list.item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/multi-select-trigger';
import '@golemui/gui-components/errors';

@Component({
  standalone: true,
  selector: 'gui-multi-dropdown-control',
  imports: [CommonModule, NgComponentOutlet],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-dropdown.component.html',
  host: {
    class: 'gui-multi-dropdown gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiDropdownComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<OptionValue[]>;

  protected adapter: InputWidgetAdapter<OptionValue[], MultiDropdownProps<any>> =
    inject(InputWidgetAdapter);
  private el = inject(ElementRef);

  triggerRef = viewChild.required<ElementRef>('triggerRef');
  listRef = viewChild.required<ElementRef>('listRef');

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultMultiListItemRenderer;

  protected currentRange = signal({ start: 0, end: 10 });
  protected listItems = signal<ListItem<any>[]>([]);
  protected focusedIndex = signal<number>(-1);
  protected isListVisible = signal(false);
  protected isFiltering = signal(false);
  private ignoreNextFocus = false;

  protected filteredItems = signal<ListItem<any>[]>([]);

  protected asyncFiltering = computed(() => {
    return !!this.widget.on?.filter;
  });

  protected displayItems = computed(() => {
    const data = this.adapter.templateData();
    if (this.isFiltering() && !this.asyncFiltering()) {
      return this.filteredItems();
    }
    return data.items || [];
  });

  protected visibleItems = computed(() => {
    const items = this.listItems();
    const { start, end } = this.currentRange();
    return items.slice(start, end);
  });

  protected currentValues = computed(() => {
    const value = this.adapter.templateData().value;
    return Array.isArray(value) ? value : [];
  });

  protected pillItems = computed(() => {
    const templateData = this.adapter.templateData();
    const labelField = (templateData.labelField as string) ?? 'label';
    const items = this.listItems();
    const source = updateListItems(
      (templateData.items ?? []) as ListItem<any>[],
      templateData as unknown as ListProps<any>,
    );
    return this.currentValues().map((value) => {
      const item = source.find((i) => i.value === value) ?? items.find((i) => i.value === value);
      const isObject = item != null && item.template !== null && typeof item.template === 'object';
      const label =
        item == null
          ? String(value)
          : isObject
            ? String((item.template as any)[labelField])
            : String(item.template);
      return { key: String(value), label };
    });
  });

  protected debouncer = new Subject<string>();
  protected subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.debouncer
        .pipe(debounceTime(this.adapter.templateData().inputDebounce ?? 500))
        .subscribe((value: string) => {
          this.inputValue(value);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.adapter.destroy();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isListVisible()) return;

    if (!this.el.nativeElement.contains(event.target)) {
      this.closeList();
    }
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

  protected openPanel() {
    this.triggerRef()?.nativeElement?.closePillsDropdown();
    this.isListVisible.set(true);

    setTimeout(() => {
      if (this.listRef()?.nativeElement) {
        this.listRef().nativeElement.scrollToSelectedIndex();
      }
    }, 0);
  }

  protected onPanelMouseDown(event: MouseEvent) {
    const target = event.target as Node;
    if (this.listRef()?.nativeElement?.contains(target)) return;
    event.preventDefault();
  }

  protected onTriggerFocusIn(event: FocusEvent) {
    if (this.ignoreNextFocus) return;
    if (this.isListVisible()) return;

    const input = this.triggerRef()?.nativeElement?.input;
    if (event.target !== input) return;

    this.openPanel();
  }

  protected onWidgetKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !this.isListVisible()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isListVisible.set(false);
    this.isFiltering.set(false);
    this.ignoreNextFocus = true;
    this.triggerRef()?.nativeElement?.focusInput();
    setTimeout(() => {
      this.ignoreNextFocus = false;
    });
  }

  protected onToggleMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  protected onToggleClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.isListVisible()) {
      this.isListVisible.set(false);
      this.isFiltering.set(false);
      this.ignoreNextFocus = true;
      this.triggerRef()?.nativeElement?.focusInput();
      setTimeout(() => {
        this.ignoreNextFocus = false;
      });
    } else {
      this.triggerRef()?.nativeElement?.focusInput();
      this.openPanel();
    }
  }

  protected onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openPanel();

      setTimeout(() => {
        if (this.listRef()?.nativeElement) {
          this.listRef().nativeElement.focus();
        }
      }, 0);
    }
  }

  protected onInput(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.debouncer.next(filterValue);
  }

  protected inputValue(filterValue: string) {
    const templateData = this.adapter.templateData();

    this.adapter.filterChanged(filterValue);

    if (filterValue && !this.asyncFiltering()) {
      this.isFiltering.set(true);
      this.isListVisible.set(true);

      const searchFields =
        templateData.searchFields ??
        ([templateData.labelField!, templateData.valueField!].filter(
          (field) => !!field,
        ) as string[]);
      const hasSearchFields = searchFields.length > 0;
      const items = templateData.items || [];
      const filtered = items.filter((item: any) => {
        const isPrimitiveValue = item === null || typeof item !== 'object';

        if (isPrimitiveValue) {
          return item != null && item.toString().toLowerCase().includes(filterValue.toLowerCase());
        }

        const keys = Object.keys(item);
        const reduceFunc = (acc: boolean, prop: string) =>
          acc || item[prop].toString().toLowerCase().includes(filterValue.toLowerCase());

        return hasSearchFields
          ? keys.filter((prop: string) => searchFields.includes(prop)).reduce(reduceFunc, false)
          : keys.reduce(reduceFunc, false);
      });
      this.filteredItems.set(filtered);
    } else {
      this.isFiltering.set(false);
      this.filteredItems.set([...(templateData.items || [])]);
    }
  }

  protected onFocusOut(event: FocusEvent) {
    const newFocusTarget = event.relatedTarget as Node;

    if (newFocusTarget && this.el.nativeElement.contains(newFocusTarget)) {
      return;
    }

    this.closeList();
  }

  protected onClickItem(item: ListItem<any>, index: number) {
    const templateData = this.adapter.templateData();

    if (templateData.readonly || item.disabled) return;

    this.toggleValue(item.value);
    this.focusedIndex.set(index);

    if (this.listRef()?.nativeElement) {
      this.listRef().nativeElement.focusItemAtIndex(index);
    }
  }

  protected onValueChange(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.toggleValue(value);
  }

  protected onPillRemove(event: Event) {
    const key = (event as CustomEvent).detail?.key;
    const value = this.currentValues().find((v) => String(v) === key);
    if (value === undefined) return;
    this.toggleValue(value);
  }

  protected onPillsDropdownToggle(event: Event) {
    if ((event as CustomEvent).detail?.open && this.isListVisible()) {
      this.isListVisible.set(false);
    }
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

  private closeList() {
    this.adapter.onBlur();
    this.isListVisible.set(false);
    this.isFiltering.set(false);
  }
}
