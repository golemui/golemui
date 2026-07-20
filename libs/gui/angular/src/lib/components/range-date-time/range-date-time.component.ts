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
import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-time-input';

@Component({
  standalone: true,
  selector: 'gui-range-date-time-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-date-time.component.html',
  host: {
    class: 'gui-range-date-time gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDateTimeComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateTimeRange[]>;
  protected adapter: InputWidgetAdapter<DateTimeRange[], RangeDateTimeInputProps> =
    inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDateTime(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
