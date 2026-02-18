import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { DropdownProps, ListItem } from '@golemui/shared-vanilla';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { DefaultListItemRenderer } from '../list/default-list.item-renderer';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}

@Component({
  standalone: true,
  selector: 'gui-dropdown-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './dropdown.component.html',
  host: {
    class: 'gui-dropdown',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DropdownComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<string>;

  protected adapter: Angular.InputWidgetAdapter<string, DropdownProps<never>> = inject(
    Angular.InputWidgetAdapter,
  );
  private el = inject(ElementRef);

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('listRef') listRef!: ElementRef<GuiListElement>;

  protected defaultListItemRenderer: Angular.AngularItemRenderer<string> = DefaultListItemRenderer;

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
    const referenceField = data.labelField ?? data.valueField;
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
      if (this.listRef?.nativeElement) {
        this.listRef.nativeElement.scrollToSelectedIndex();
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
          if (this.listRef?.nativeElement) {
            this.listRef.nativeElement.focus();
            this.listRef.nativeElement.scrollToSelectedIndex();
          }
        }, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (!this.inputRef.nativeElement.value) {
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
        const keys = Object.keys(item);

        // If it's a primitive value, we search by value
        const isPrimitiveValue = !keys.length;
        if (isPrimitiveValue) {
          return item.toString().toLowerCase().includes(filterValue.toLowerCase());
        }

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

    if (this.listRef?.nativeElement) {
      this.listRef.nativeElement.focusItemAtIndex(index);
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
