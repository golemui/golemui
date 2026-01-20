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
import { DefaultListItemRenderer } from '../list/default-list.item-renderer';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}

@Component({
  standalone: true,
  selector: 'gui-dropdown-control',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './dropdown.component.html',
  host: {
    class: 'gui-dropdown',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DropdownComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;

  protected adapter: Angular.ControlFieldAdapter<string, DropdownProps<any>> = inject(
    Angular.ControlFieldAdapter,
  );
  private el = inject(ElementRef);

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('listRef') listRef!: ElementRef<GuiListElement>;

  protected defaultListItemRenderer: Angular.AngularItemRenderer<string> = DefaultListItemRenderer;

  protected currentRange = signal({ start: 0, end: 10 });
  protected listItems = signal<ListItem<any>[]>([]);
  protected focusedIndex = signal<number>(-1);
  protected isListVisible = signal(false);
  protected isFiltering = signal(false);

  protected filteredItems = signal<ListItem<any>[]>([]);

  protected displayItems = computed(() => {
    const data = this.adapter.templateData();
    if (this.isFiltering()) {
      return this.filteredItems();
    }
    return data.items || [];
  });

  protected visibleItems = computed(() => {
    const items = this.listItems();
    const { start, end } = this.currentRange();
    return items.slice(start, end);
  });

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
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
    const templateData = this.adapter.templateData();

    if (filterValue) {
      this.isFiltering.set(true);
      this.isListVisible.set(true);

      const items = templateData.items || [];
      const filtered = items.filter((item: any) =>
        templateData.valueField
          ? item[templateData.valueField]
              .toString()
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          : item.toString().toLowerCase().includes(filterValue.toLowerCase()),
      );
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

  protected onClickItem(item: any, index: number) {
    const templateData = this.adapter.templateData();

    if (templateData.readonly) return;

    this.adapter.valueChanged(item.value);

    this.focusedIndex.set(index);
    this.isFiltering.set(false);
    this.isListVisible.set(false);

    if (this.inputRef) {
      this.inputRef.nativeElement.value = templateData.valueField
        ? item.template[templateData.valueField]
        : item.template;
    }

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
    this.isListVisible.set(false);
    this.isFiltering.set(false);
  }

  private closeList() {
    this.adapter.onBlur();
    this.isListVisible.set(false);
    this.isFiltering.set(false);
  }
}
