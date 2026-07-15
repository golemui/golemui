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
import type { TimeRange, RangeTimeInputProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/range-time-input';

@Component({
  standalone: true,
  selector: 'gui-range-time-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './range-time.component.html',
  host: {
    class: 'gui-range-time gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeTimeComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<TimeRange[]>;
  protected adapter: InputWidgetAdapter<TimeRange[], RangeTimeInputProps> =
    inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeTime(event: Event) {
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
