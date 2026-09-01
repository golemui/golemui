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
import type { DateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-date-input';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-range-date-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-date.component.html',
  host: {
    class: 'gui-range-date gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDateComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateRange[]>;
  protected adapter: InputWidgetAdapter<DateRange[], RangeDateInputProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
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
