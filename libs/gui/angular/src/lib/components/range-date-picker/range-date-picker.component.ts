import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type DateRange, type RangeDatePickerProps } from '@golemui/gui-shared';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';

@Component({
  standalone: true,
  selector: 'gui-range-date-picker-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './range-date-picker.component.html',
  host: {
    class: 'gui-range-date-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDatePickerComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<DateRange[]>;
  protected adapter: Angular.InputWidgetAdapter<DateRange[], RangeDatePickerProps> = inject(
    Angular.InputWidgetAdapter,
  );
  private el = inject(ElementRef);

  dateControl = viewChild<ElementRef>('dateControlRef');
  calendarControl = viewChild<ElementRef>('calendarControlRef');

  readonly isCalendarOpen = signal(false);
  readonly focusDate = signal<string | undefined>(undefined);

  onFocusOut(event: FocusEvent) {
    if (!this.isCalendarOpen()) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.el.nativeElement.contains(newFocusTarget)) {
      return;
    }

    this.closeCalendar();
  }

  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      !this.dateControl()?.nativeElement.contains(targetElement) &&
      !this.calendarControl()?.nativeElement.contains(targetElement)
    ) {
      this.closeCalendar();
    }
  }

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  onBlurCalendar() {
    this.adapter.onBlur();
    this.closeCalendar();
  }

  onPillClick(event: Event) {
    this.focusDate.set((event as CustomEvent).detail.range.start);
    this.openCalendar();
  }

  toggleCalendar(event: Event) {
    const target = event.target as HTMLElement;
    const isInputClick = target.closest('.gui-range-date-input__part');
    const isCalendarClick = target.closest('gui-range-calendar');
    const isPillClick = target.closest('.gui-range-date-input__pill');
    const isPillCountClick = target.closest('.gui-range-date-input__pill--count');
    if (isInputClick || isCalendarClick || isPillClick) {
      this.openCalendar();
    } else if (isPillCountClick) {
      this.closeCalendar();
    } else {
      this.isCalendarOpen.set(!this.isCalendarOpen());
    }
  }

  openCalendar() {
    this.isCalendarOpen.set(true);
  }

  closeCalendar() {
    this.isCalendarOpen.set(false);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
