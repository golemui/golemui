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
import type { TimeRange, MultiRangeTimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/multi-range-time-picker';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-multi-range-time-picker-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-range-time-picker.component.html',
  host: {
    class: 'gui-multi-range-time-picker gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiRangeTimePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<TimeRange[]>;
  protected adapter: InputWidgetAdapter<TimeRange[], MultiRangeTimePickerProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeTime(event: Event) {
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
