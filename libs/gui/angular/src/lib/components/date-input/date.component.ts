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
import { type DatePickerProps } from '@golemui/gui-shared';
import '@golemui/gui-components/date-input';

@Component({
  standalone: true,
  selector: 'gui-date-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './date.component.html',
  host: {
    class: 'gui-date gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DateComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, DatePickerProps> = inject(InputWidgetAdapter);
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
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
