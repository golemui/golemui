import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { DateTimeRange, MultiRangeDateTimeCalendarProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/multi-range-date-time-calendar';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-multi-range-date-time-calendar-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-range-date-time-calendar.component.html',
  host: {
    class: 'gui-multi-range-date-time-calendar gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiRangeDateTimeCalendarComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateTimeRange[]>;
  protected adapter: InputWidgetAdapter<DateTimeRange[], MultiRangeDateTimeCalendarProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeValue(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  protected onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
    // Surface the error immediately on a completed selection.
    this.adapter.onBlur();
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
