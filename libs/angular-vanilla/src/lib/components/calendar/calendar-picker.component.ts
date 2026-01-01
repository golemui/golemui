import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, input, model, viewChildren } from '@angular/core';
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
  isFocusable: boolean;
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
  dayButtons = viewChildren<ElementRef<HTMLButtonElement>>('dayButtonRef');

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

    let isDayFocusable = false;
    let days: CalendarDay[] = [];

    // 6 weeks x 7 days = 42 days
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isSelected = this.isSelected(date);
      const isToday = this.isToday(date);
      const isFocusable = isSelected && isCurrentMonth;

      if (isFocusable) {
        isDayFocusable = true;
      }

      days.push({
        date: date,
        dayLabel: Intl.DateTimeFormat(this.localeId, {
          day: this.adapter().templateData().dayFormat ?? 'numeric',
        }).format(date),
        isCurrentMonth: isCurrentMonth,
        isToday: isToday,
        isSelected: isSelected,
        isFocusable: isFocusable,
      });
    }

    // No days are selected, so we make focusable today's date
    if (!isDayFocusable) {
      const today = days.find((day) => day.isToday && day.isCurrentMonth);
      if (today) {
        isDayFocusable = true;
        today.isFocusable = true;
      }
    }

    // No days are selected, so we make focusable the first day of the month
    if (!isDayFocusable) {
      days.filter((d) => d.isCurrentMonth)[0].isFocusable = true;
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

  onKeyDown(event: KeyboardEvent, day: CalendarDay) {
    const dayButtons = [...this.dayButtons().filter((b) => !b.nativeElement.disabled)];
    const buttonIndex = dayButtons.findIndex((b) => b.nativeElement === event.target);
    let nextIndex = buttonIndex;
    let doFocus = false;

    switch (event.key) {
      case 'ArrowLeft':
        doFocus = true;
        nextIndex = buttonIndex - 1;
        event.preventDefault();
        break;
      case 'ArrowRight':
        doFocus = true;
        nextIndex = buttonIndex + 1;
        event.preventDefault();
        break;
      case 'ArrowUp':
        doFocus = true;
        nextIndex = buttonIndex - 7;
        event.preventDefault();
        break;
      case 'ArrowDown':
        doFocus = true;
        nextIndex = buttonIndex + 7;
        event.preventDefault();
        break;
      case ' ':
      case 'Enter':
        doFocus = true;
        this.clickDay(buttonIndex, day);
        event.preventDefault();
        break;
    }

    if (nextIndex < 0) {
      // Load previous month
      const prevMonthTotalDays = new Date(
        this.currentDate().getFullYear(),
        this.currentDate().getMonth(),
        0,
      );
      this.prevMonth();
      nextIndex = prevMonthTotalDays.getDate() + nextIndex;
    } else if (nextIndex >= dayButtons.length) {
      // Load next month
      const currentMonthTotalDays = new Date(
        this.currentDate().getFullYear(),
        this.currentDate().getMonth() + 1,
        0,
      );
      this.nextMonth();
      nextIndex = nextIndex - currentMonthTotalDays.getDate();
    }

    setTimeout(() => {
      if (doFocus) {
        this.dayButtons()
          .filter((b) => !b.nativeElement.disabled)
          [nextIndex].nativeElement.focus();
      }
    }, 1);
  }

  clickDay(index: number, day: CalendarDay) {
    this.adapter().valueChanged(day.date.toISOString());
    setTimeout(() => {
      this.dayButtons()[index].nativeElement.focus();
    }, 1);
  }

  getOrderedWeekDays(firstDayFromJSON: number) {
    const startDayIndex = firstDayFromJSON % 7;
    // 0=Sunday, 1=Monday, etc...
    const baseWeek = [0, 1, 2, 3, 4, 5, 6];
    return [...baseWeek.slice(startDayIndex), ...baseWeek.slice(0, startDayIndex)];
  }

  clickPrevMonth(event: MouseEvent) {
    event.preventDefault();
    this.prevMonth();
  }

  prevMonth() {
    this.currentDate.update((d) => {
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  }

  clickNextMonth(event: MouseEvent) {
    event.preventDefault();
    this.nextMonth();
  }

  nextMonth() {
    this.currentDate.update((d) => {
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
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

  private isTodaysMonth(date: Date): boolean {
    const today = new Date();
    return date.getMonth() === today.getMonth();
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
