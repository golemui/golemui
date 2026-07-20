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
import type { RangeCalendarProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-calendar';

@Component({
  standalone: true,
  selector: 'gui-range-calendar-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-calendar.component.html',
  host: {
    class: 'gui-range-calendar gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeCalendarComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, RangeCalendarProps> = inject(InputWidgetAdapter);
  currentDate = new Date();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
    this.adapter.onBlur();
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
