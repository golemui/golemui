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
import type { DateTimeRange, RangeDateTimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-time-picker';

@Component({
  standalone: true,
  selector: 'gui-range-date-time-picker-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-date-time-picker.component.html',
  host: {
    class: 'gui-range-date-time-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDateTimePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateTimeRange[]>;
  protected adapter: InputWidgetAdapter<DateTimeRange[], RangeDateTimePickerProps> =
    inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeValue(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  protected onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
    this.adapter.onBlur();
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
