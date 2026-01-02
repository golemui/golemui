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

  invalidDate = signal(false);

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

  maxMonth = 12;
  minMonth = 1;
  maxYear = 9999;
  minYear = 0;
  maxDay = (month: number, year: number) => {
    if (month === 2) {
      const isLeapYear = new Date(year, 1, 29).getDate() === 29;
      return isLeapYear || !year ? 29 : 28;
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30;
    }
    return 31;
  };
  minDay = 1;

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

  keyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Enter',
    ];

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  keyUp(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;

    // We jump to the next input when we type max digits
    if (input.value.length === input.maxLength && /^[0-9]$/.test(event.key)) {
      const inputIndex = this.inputs().findIndex((ref) => ref.nativeElement === input);
      if (inputIndex < this.inputs().length - 1) {
        this.inputs()[inputIndex + 1].nativeElement.focus();
      }
    }

    const inputIndex = this.inputs().findIndex((ref) => ref.nativeElement === input);
    switch (event.key) {
      case 'ArrowUp': {
        const value = isNaN(parseInt(input.value, 10) + 1) ? 1 : parseInt(input.value, 10) + 1;
        input.value = String(value).padStart(input.maxLength, '0');
        input.select();
        this.valueChanged();
        break;
      }
      case 'ArrowDown': {
        const value = isNaN(parseInt(input.value, 10) - 1) ? 1 : parseInt(input.value, 10) - 1;
        input.value = String(value).padStart(input.maxLength, '0');
        input.select();
        this.valueChanged();
        break;
      }
      case 'ArrowLeft':
        if (inputIndex > 0) {
          const nextInput = this.inputs()[inputIndex - 1].nativeElement;
          nextInput.focus();
          nextInput.select();
        }
        break;
      case 'ArrowRight':
        if (inputIndex < this.inputs().length - 1) {
          const nextInput = this.inputs()[inputIndex + 1].nativeElement;
          nextInput.focus();
          nextInput.select();
        }
        break;
    }
  }

  openCalendar(event?: FocusEvent) {
    if (event) {
      (event.currentTarget as HTMLInputElement).select();
    }
    this.isCalendarOpen.set(true);
  }

  closeCalendar() {
    this.isCalendarOpen.set(false);
  }

  onInputBlur(event: FocusEvent, type: 'day' | 'month' | 'year') {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);

    if (!isNaN(val) && val > 0) {
      const length = type === 'year' ? 4 : 2;
      input.value = val.toString().padStart(length, '0');
    }

    this.adapter.onBlur();
  }

  valueChanged() {
    let dayVal = parseInt(this.dayInput().nativeElement.value, 10);
    let monthVal = parseInt(this.monthInput().nativeElement.value, 10);
    let yearVal = parseInt(this.yearInput().nativeElement.value, 10);

    if (yearVal > this.maxYear) {
      yearVal = this.maxYear;
      this.yearInput().nativeElement.value = yearVal.toString().padStart(4, '0');
    }
    if (yearVal < this.minYear) {
      yearVal = this.minYear;
      this.yearInput().nativeElement.value = yearVal.toString().padStart(4, '0');
    }

    if (monthVal > this.maxMonth) {
      monthVal = this.maxMonth;
      this.monthInput().nativeElement.value = monthVal.toString().padStart(2, '0');
    }
    if (monthVal < this.minMonth) {
      monthVal = this.minMonth;
      this.monthInput().nativeElement.value = monthVal.toString().padStart(2, '0');
    }

    const maxDay = this.maxDay(monthVal, yearVal);
    if (dayVal > maxDay) {
      dayVal = maxDay;
      this.dayInput().nativeElement.value = dayVal.toString().padStart(2, '0');
    }
    if (dayVal < this.minDay) {
      dayVal = this.minDay;
      this.dayInput().nativeElement.value = dayVal.toString().padStart(2, '0');
    }

    const isDayValid = !isNaN(dayVal) && dayVal > 0 && dayVal <= maxDay;
    const isMonthValid = !isNaN(monthVal) && monthVal > 0;
    const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;

    if (isDayValid && isMonthValid && isYearValid) {
      this.invalidDate.set(false);
      const currentDate = new Date(yearVal, monthVal - 1, dayVal);
      this.currentDate = currentDate;
      this.adapter.valueChanged(currentDate.toISOString());
    }
  }
}
