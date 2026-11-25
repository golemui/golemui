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
import type { DateRange, MultiRangeDatePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/multi-range-date-picker';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-multi-range-date-picker-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-range-date-picker.component.html',
  host: {
    class: 'gui-multi-range-date-picker gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiRangeDatePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateRange[]>;
  protected adapter: InputWidgetAdapter<DateRange[], MultiRangeDatePickerProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeDate(event: Event) {
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
