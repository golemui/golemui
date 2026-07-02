import { CommonModule } from '@angular/common';
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
import type { DropdownProps, ListItem } from '@golemui/gui-shared/internals';
import { debounceTime, Subject, type Subscription } from 'rxjs';
import { DefaultListItemRenderer } from '../list/default-list.item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';

@Component({
  standalone: true,
  selector: 'gui-dropdown-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './dropdown.component.html',
  host: {
    class: 'gui-dropdown gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DropdownComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;

  protected adapter: InputWidgetAdapter<string, DropdownProps<never>> = inject(InputWidgetAdapter);
  private el = inject(ElementRef);

  inputRef = viewChild.required<ElementRef>('inputRef');
  listRef = viewChild.required<ElementRef>('listRef');

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultListItemRenderer;

  protected currentRange = signal({ start: 0, end: 10 });
  protected listItems = signal<ListItem<never>[]>([]);
  protected focusedIndex = signal<number>(-1);
  protected isListVisible = signal(false);
  protected isFiltering = signal(false);

  protected selectedItem = signal<ListItem<never> | undefined>(undefined);
  protected filteredItems = signal<ListItem<never>[]>([]);

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

  protected selectedItemValue = computed(() => {
    const data = this.adapter.templateData();
    const isObject =
      this.selectedItem()?.template !== null && typeof this.selectedItem()?.template === 'object';
    const referenceField = isObject ? (data.labelField ?? 'label') : null;

    return referenceField
      ? this.selectedItem()?.template[referenceField]
      : this.selectedItem()?.template;
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

  protected onInputFocus() {
    this.isListVisible.set(true);

    setTimeout(() => {
      if (this.listRef()?.nativeElement) {
        this.listRef().nativeElement.scrollToSelectedIndex();
      }
    }, 0);
  }

  protected onInputKeyDown(event: KeyboardEvent) {
    const key = event.key;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this.isListVisible.set(true);

        setTimeout(() => {
          if (this.listRef()?.nativeElement) {
            this.listRef().nativeElement.focus();
            this.listRef().nativeElement.scrollToSelectedIndex();
          }
        }, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (!this.inputRef().nativeElement.value) {
          // Field is empty and enter pressed, we clear the selection
          this.adapter.valueChanged(null);
          this.isListVisible.set(false);
          this.isFiltering.set(false);
        }
        break;
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
        // If it's a primitive value, we search by value. Note: Object.keys on a
        // string returns its character indices, so check the type instead
        const isPrimitiveValue = item === null || typeof item !== 'object';
        if (isPrimitiveValue) {
          return item != null && item.toString().toLowerCase().includes(filterValue.toLowerCase());
        }

        const keys = Object.keys(item);

        // Otherwise, we search by object
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

  protected onFocusOutInput(event: FocusEvent) {
    const newFocusTarget = event.relatedTarget as Node;

    if (newFocusTarget && this.el.nativeElement.contains(newFocusTarget)) {
      return;
    }

    this.closeList();
  }

  protected onClickItem(item: ListItem<never>, index: number) {
    const templateData = this.adapter.templateData();

    if (templateData.readonly) return;

    this.adapter.valueChanged(item.value);
    this.adapter.filterChanged('');

    this.focusedIndex.set(index);
    this.selectedItem.set(item);
    this.isFiltering.set(false);
    this.isListVisible.set(false);

    if (this.listRef()?.nativeElement) {
      this.listRef().nativeElement.focusItemAtIndex(index);
    }
  }

  protected onFocusChange(event: Event) {
    const index = (event as CustomEvent).detail.index;
    this.focusedIndex.set(index);
  }

  protected onUpdateItems(event: Event) {
    const items = (event as CustomEvent).detail;
    this.listItems.set(items ? [...items] : []);

    // Resolve selected item on initial load when a default value is set
    if (!this.selectedItem() && this.adapter.templateData().value != null) {
      const match = (items ?? []).find(
        (item: ListItem<never>) => item.value === this.adapter.templateData().value,
      );
      if (match) {
        this.selectedItem.set(match);
      }
    }
  }

  protected onRangeChange(event: Event) {
    const { startIndex, endIndex } = (event as CustomEvent).detail;
    this.currentRange.set({ start: startIndex, end: endIndex });
  }

  protected onListBlur() {
    this.closeList();
  }

  protected onValueChange(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
    this.adapter.filterChanged('');
    this.selectedItem.set(this.listItems().find((item) => item.value === value));
    this.isListVisible.set(false);
    this.isFiltering.set(false);
  }

  private closeList() {
    this.adapter.onBlur();
    this.isListVisible.set(false);
    this.isFiltering.set(false);
  }
}
