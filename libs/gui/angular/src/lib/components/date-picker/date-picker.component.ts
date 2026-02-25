import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { DatePickerProps } from '@golemui/gui-components';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';

@Component({
  standalone: true,
  selector: 'gui-date-picker-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './date-picker.component.html',
  host: {
    class: 'gui-date-picker',
    '(document:click)': 'onDocumentClick($event)',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DatePickerComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<string>;
  protected adapter: Angular.InputWidgetAdapter<string, DatePickerProps> = inject(
    Angular.InputWidgetAdapter,
  );
  currentDate = new Date();

  dateControl = viewChild<ElementRef>('dateControlRef');
  calendarControl = viewChild<ElementRef>('calendarControlRef');

  readonly isCalendarOpen = signal(false);

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
