import { CommonModule } from '@angular/common';
import { Component, computed, input, model } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { weekInfoData } from './week-info';

export interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  standalone: true,
  selector: 'gui-calendar-picker',
  imports: [CommonModule, ErrorsComponent],
  templateUrl: './calendar-picker.component.html',
})
export class CalendarPickerComponent implements Core.WithField {
  field!: Core.ControlField<string>;
  adapter = input.required<Angular.ControlFieldAdapter<string, CalendarProps>>();
  currentDate = model.required<Date>();

  // TODO: Get localeId from i18n feature
  localeId = 'es';
  locale = weekInfoData[this.localeId];
  weekDays = this.getOrderedWeekDays(this.locale.firstDay);

  readonly monthName = computed(() => {
    const current = this.currentDate();
    return new Intl.DateTimeFormat(this.localeId, {
      month: this.adapter().templateData().monthFormat ?? 'long',
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
          day: this.adapter().templateData().dayFormat ?? 'numeric',
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
      weekday: this.adapter().templateData().weekdayFormat ?? 'narrow',
    });

    // 30-11-2025 was Sunday, so we use it as the first day of the week
    const sundayRef = new Date(2025, 10, 30);

    return [...this.weekDays].map((dayCode) => {
      const targetDate = new Date(sundayRef);
      targetDate.setDate(sundayRef.getDate() + dayCode);
      return formatter.format(targetDate);
    });
  });

  clickDay(event: MouseEvent, day: CalendarDay) {
    event.preventDefault();
    this.adapter().valueChanged(day.date.toISOString());
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
    if (this.adapter().templateData().value) {
      const selectedDate = new Date(this.adapter().templateData().value as string);
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
