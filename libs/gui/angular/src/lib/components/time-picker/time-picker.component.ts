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
import type { ListItem, TimePickerProps } from '@golemui/gui-shared/internals';
import {
  buildTimeOptions,
  formatISOTimeForLocale,
  NO_AVAILABLE_TIMES_MESSAGE,
  resolveHourFormat,
} from '@golemui/gui-components/internals';
import { DefaultListItemRenderer } from '../list/default-list.item-renderer';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import '@golemui/gui-components/time-input';
import '@golemui/gui-components/list';

@Component({
  standalone: true,
  selector: 'gui-time-picker-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent],
  providers: [InputWidgetAdapter],
  templateUrl: './time-picker.component.html',
  host: {
    class: 'gui-time-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
    '(focusout)': 'onFocusOut($event)',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TimePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;

  protected adapter: InputWidgetAdapter<string, TimePickerProps> = inject(InputWidgetAdapter);
  private el = inject(ElementRef);

  timeControl = viewChild<ElementRef>('timeControlRef');
  listRef = viewChild.required<ElementRef>('listRef');

  protected defaultListItemRenderer: AngularItemRenderer<string> = DefaultListItemRenderer;
  protected readonly noAvailableTimesDefault = NO_AVAILABLE_TIMES_MESSAGE;

  protected currentRange = signal({ start: 0, end: 10 });
  protected focusedIndex = signal<number>(-1);
  protected isListVisible = signal(false);

  /** Selectable slots with locale display labels, disabled inside disabledRanges. */
  protected timeItems = computed<ListItem<string>[]>(() => {
    const templateData = this.adapter.templateData();
    const hourFormat = resolveHourFormat(templateData.lang, templateData.hourFormat);
    return buildTimeOptions(templateData).map((slot) => ({
      template: formatISOTimeForLocale(slot.value, templateData.lang, hourFormat),
      value: slot.value,
      disabled: slot.disabled,
    }));
  });

  protected visibleItems = computed(() => {
    const items = this.timeItems();
    const { start, end } = this.currentRange();
    return items.slice(start, end);
  });

  ngOnInit(): void {
    this.adapter.init(this.widget);
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

  onFocusOut(event: FocusEvent) {
    if (!this.isListVisible()) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.el.nativeElement.contains(newFocusTarget)) {
      return;
    }

    this.closeList();
  }

  protected onChangeTime(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  protected onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  protected toggleList(event: Event) {
    if (this.adapter.templateData().disabled) return;
    const target = event.target as HTMLElement;

    if (target.closest('.gui-list__item-wrapper')) return;

    const isInputClick = target.closest('.gui-time-input__part');
    const isListClick = target.closest('gui-list');
    if (isInputClick || isListClick) {
      this.openList();
    } else {
      this.isListVisible.set(!this.isListVisible());
    }
  }

  protected openList() {
    if (this.adapter.templateData().disabled) return;
    this.isListVisible.set(true);

    setTimeout(() => {
      if (this.listRef()?.nativeElement) {
        this.listRef().nativeElement.scrollToSelectedIndex();
      }
    }, 0);
  }

  protected closeList() {
    this.isListVisible.set(false);
  }

  protected toggleListFromKeyboard(event: Event) {
    if (this.adapter.templateData().disabled) return;
    if (event.target !== event.currentTarget) return;
    this.isListVisible.set(!this.isListVisible());
  }

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  protected onKeyDown(event: KeyboardEvent) {
    const templateData = this.adapter.templateData();
    if (templateData.allowCustomTime || templateData.readonly || templateData.disabled) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const target = event.target as HTMLElement;
    if (!target.closest('gui-time')) return;

    event.preventDefault();
    const items = this.timeItems();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const currentIndex = items.findIndex((item) => item.value === templateData.value);
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : currentIndex + direction;
    while (index >= 0 && index < items.length && items[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= items.length) return;

    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(items[index].value as string);
    this.focusedIndex.set(index);
    this.openList();
  }

  protected onClickItem(item: ListItem<string>, index: number) {
    const templateData = this.adapter.templateData();

    if (templateData.readonly || item.disabled) return;

    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(item.value as string);
    this.focusedIndex.set(index);
    this.isListVisible.set(false);
  }

  protected onFocusChange(event: Event) {
    this.focusedIndex.set((event as CustomEvent).detail.index);
  }

  protected onRangeChange(event: Event) {
    const { startIndex, endIndex } = (event as CustomEvent).detail;
    this.currentRange.set({ start: startIndex, end: endIndex });
  }

  // Enter/Space selection inside the list commits a single time, so close
  protected onValueChange(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
    this.isListVisible.set(false);
  }
}
