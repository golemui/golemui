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
import type { DateRange, RangeDatePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-picker';

@Component({
  standalone: true,
  selector: 'gui-range-date-picker-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-date-picker.component.html',
  host: {
    class: 'gui-range-date-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDatePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateRange[]>;
  protected adapter: InputWidgetAdapter<DateRange[], RangeDatePickerProps> =
    inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeDate(event: Event) {
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
