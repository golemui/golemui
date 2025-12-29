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
} from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { GuiAriaDirective } from '../../directives/aria.directive';
import { IconComponent } from '../../utils/templates/icon.component';
import { LabelComponent } from '../../utils/templates/label.component';
import { weekInfoData } from './week-info';

interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  standalone: true,
  selector: 'gui-calendar',
  imports: [CommonModule, ErrorsComponent, GuiAriaDirective, IconComponent, LabelComponent],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './calendar.component.html',
  host: {
    class: 'gui-calendar',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class CalendarComponent implements OnInit, OnDestroy, Core.WithField {
  dayInput = viewChild.required<ElementRef<HTMLInputElement>>('dayInput');
  monthInput = viewChild.required<ElementRef<HTMLInputElement>>('monthInput');
  yearInput = viewChild.required<ElementRef<HTMLInputElement>>('yearInput');

  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, CalendarProps> = inject(
    Angular.ControlFieldAdapter,
  );
  protected elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  // TODO: Get localeId from i18n feature
  localeId = 'es';
  locale = weekInfoData[this.localeId];
  weekDays = this.getOrderedWeekDays(this.locale.firstDay);

  readonly isCalendarOpen = signal(false);
  readonly currentDate = signal<Date>(new Date());

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
      ? Intl.DateTimeFormat(this.localeId, { day: '2-digit' }).format(new Date(val as string))
      : null;
  });
  readonly currentMonth = computed(() => {
    const val = this.adapter.templateData().value;
    return val
      ? Intl.DateTimeFormat(this.localeId, { month: '2-digit' }).format(new Date(val as string))
      : null;
  });
  readonly currentYear = computed(() => {
    const val = this.adapter.templateData().value;
    return val
      ? Intl.DateTimeFormat(this.localeId, { year: 'numeric' }).format(new Date(val as string))
      : null;
  });

  readonly monthName = computed(() => {
    const current = this.currentDate();
    return new Intl.DateTimeFormat(this.localeId, {
      month: this.adapter.templateData().monthFormat ?? 'long',
    }).format(current);
  });

  readonly daysInMonth = computed(() => {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const gridStartDay = this.weekDays[0];
    const offset = (dayOfWeek - gridStartDay + 7) % 7;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - offset);

    let days: CalendarDay[] = [];

    // 6 weeks x 7 days = 42 days
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      days.push({
        date: date,
        dayLabel: Intl.DateTimeFormat(this.localeId, {
          day: this.adapter.templateData().dayFormat ?? 'numeric',
        }).format(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isToday(date),
        isSelected: this.isSelected(date),
      });
    }

    // Check if we need to display the 6th week
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !day.isCurrentMonth)) {
      days = days.slice(0, -7);
    }

    return days;
  });

  readonly getWeekDays = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.localeId, {
      weekday: this.adapter.templateData().weekdayFormat ?? 'narrow',
    });

    // 30-11-2025 was Sunday, so we use it as the first day of the week
    const sundayRef = new Date(2025, 10, 30);

    return [...this.weekDays].map((dayCode) => {
      const targetDate = new Date(sundayRef);
      targetDate.setDate(sundayRef.getDate() + dayCode);
      return formatter.format(targetDate);
    });
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

  clickDay(event: MouseEvent, day: CalendarDay) {
    event.preventDefault();
    this.adapter.valueChanged(day.date.toISOString());
  }

  valueChanged() {
    if (this.isDateCompleted()) {
      const day = this.dayInput().nativeElement.valueAsNumber;
      const month = this.monthInput().nativeElement.valueAsNumber;
      const year = this.yearInput().nativeElement.valueAsNumber;
      const currentDate = new Date(year, month - 1, day);
      this.currentDate.update(() => currentDate);
      this.adapter.valueChanged(currentDate.toISOString());
    }
  }

  getOrderedWeekDays(firstDayFromJSON: number) {
    const startDayIndex = firstDayFromJSON % 7;
    // 0=Sunday, 1=Monday, etc...
    const baseWeek = [0, 1, 2, 3, 4, 5, 6];
    return [...baseWeek.slice(startDayIndex), ...baseWeek.slice(0, startDayIndex)];
  }

  nextMonth(event: MouseEvent) {
    event.preventDefault();
    this.currentDate.update((d) => {
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  }

  prevMonth(event: MouseEvent) {
    event.preventDefault();
    this.currentDate.update((d) => {
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  private isSelected(date: Date): boolean {
    if (this.adapter.templateData().value) {
      const selectedDate = new Date(this.adapter.templateData().value as string);
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    } else {
      return false;
    }
  }
}
