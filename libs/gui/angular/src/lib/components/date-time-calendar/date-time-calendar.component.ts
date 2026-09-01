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
import type { DateTimeCalendarProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/date-time-calendar';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-date-time-calendar-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './date-time-calendar.component.html',
  host: {
    class: 'gui-date-time-calendar gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DateTimeCalendarComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, DateTimeCalendarProps> = inject(InputWidgetAdapter);
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
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
