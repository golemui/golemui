import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, type OnDestroy, type OnInit } from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular'
import type { InputWidget, WithWidget } from '@golemui/core'
import { type DateRange, type RangeDateInputProps } from '@golemui/gui-shared';

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
  protected adapter: InputWidgetAdapter<DateRange[], RangeDateInputProps> = inject(
    InputWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
