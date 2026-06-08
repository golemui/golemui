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
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import { type DatePickerProps } from '@golemui/gui-shared';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import '@golemui/gui-components/date-input';
import '@golemui/gui-components/calendar';

@Component({
  standalone: true,
  selector: 'gui-date-picker-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent],
  providers: [InputWidgetAdapter],
  templateUrl: './date-picker.component.html',
  host: {
    class: 'gui-date-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DatePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, DatePickerProps> = inject(InputWidgetAdapter);
  private el = inject(ElementRef);
  currentDate = new Date();

  dateControl = viewChild<ElementRef>('dateControlRef');
  calendarControl = viewChild<ElementRef>('calendarControlRef');

  readonly isCalendarOpen = signal(false);

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

  // Selecting a day in the calendar commits a single date, so close the
  // calendar afterwards. The range picker intentionally stays open so the user
  // can select multiple ranges and closes it themselves.
  onCalendarChange(event: Event) {
    this.onChangeDate(event);
    this.closeCalendar();
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  onBlurCalendar() {
    this.adapter.onBlur();
    this.closeCalendar();
  }

  toggleCalendar(event: Event) {
    const target = event.target as HTMLElement;
    const isInputClick = target.closest('.gui-date-input__part');
    const isCalendarClick = target.closest('gui-calendar');
    if (isInputClick || isCalendarClick) {
      this.openCalendar();
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
