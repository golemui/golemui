import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { GuiAriaDirective } from '../../directives/aria.directive';
import { IconComponent } from '../../utils/templates/icon.component';
import { LabelComponent } from '../../utils/templates/label.component';
import { CalendarPickerComponent } from '../calendar/calendar-picker.component';

@Component({
  standalone: true,
  selector: 'gui-date-picker',
  imports: [
    CommonModule,
    ErrorsComponent,
    GuiAriaDirective,
    IconComponent,
    LabelComponent,
    CalendarPickerComponent,
  ],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './date-picker.component.html',
  host: {
    class: 'gui-date-picker',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DatePickerComponent implements OnInit, OnDestroy, Core.WithField {
  dayInput = viewChild.required<ElementRef<HTMLInputElement>>('dayInput');
  monthInput = viewChild.required<ElementRef<HTMLInputElement>>('monthInput');
  yearInput = viewChild.required<ElementRef<HTMLInputElement>>('yearInput');
  inputs = viewChildren<ElementRef<HTMLInputElement>>('dateInput');

  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, CalendarProps> = inject(
    Angular.ControlFieldAdapter,
  );
  protected elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  currentDate = new Date();

  // TODO: Get localeId from i18n feature
  localeId = 'es';

  readonly isCalendarOpen = signal(false);

  readonly dateParts = computed(() => {
    return Intl.DateTimeFormat(this.localeId, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());
  });

  readonly currentDay = computed(() => {
    const val = this.adapter.templateData().value;
    return val
      ? Intl.DateTimeFormat(this.localeId, { day: '2-digit' })
          .formatToParts(new Date(val as string))
          .find((p) => p.type === 'day')?.value
      : null;
  });
  readonly currentMonth = computed(() => {
    const val = this.adapter.templateData().value;
    return val
      ? Intl.DateTimeFormat(this.localeId, { month: '2-digit' })
          .formatToParts(new Date(val as string))
          .find((p) => p.type === 'month')?.value
      : null;
  });
  readonly currentYear = computed(() => {
    const val = this.adapter.templateData().value;
    return val
      ? Intl.DateTimeFormat(this.localeId, { year: 'numeric' })
          .formatToParts(new Date(val as string))
          .find((p) => p.type === 'year')?.value
      : null;
  });

  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (targetElement && !this.elementRef.nativeElement.contains(targetElement)) {
      this.closeCalendar();
    }
  }

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  keyUp(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const inputIndex = this.inputs().findIndex((ref) => ref.nativeElement === input);

    switch (event.key) {
      case 'ArrowLeft':
        if (inputIndex > 0) {
          this.inputs()[inputIndex - 1].nativeElement.focus();
        }
        break;
      case 'ArrowRight':
        if (inputIndex < this.inputs().length - 1) {
          this.inputs()[inputIndex + 1].nativeElement.focus();
        }
        break;
    }
  }

  openCalendar() {
    this.isCalendarOpen.set(true);
  }

  closeCalendar() {
    this.isCalendarOpen.set(false);
  }

  isDateCompleted() {
    return (
      this.dayInput().nativeElement.valueAsNumber > 0 &&
      this.monthInput().nativeElement.valueAsNumber > 0 &&
      this.yearInput().nativeElement.valueAsNumber > 3
    );
  }

  valueChanged() {
    if (this.isDateCompleted()) {
      const day = this.dayInput().nativeElement.valueAsNumber;
      const month = this.monthInput().nativeElement.valueAsNumber;
      const year = this.yearInput().nativeElement.valueAsNumber;
      const currentDate = new Date(year, month - 1, day);
      this.currentDate = currentDate;
      this.adapter.valueChanged(currentDate.toISOString());
    }
  }
}
