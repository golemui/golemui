import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { DateRange, RangeDateInputProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-range-date-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './range-date.component.html',
  host: {
    class: 'gui-range-date gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDateComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<DateRange[]>;
  protected adapter: Angular.InputWidgetAdapter<DateRange[], RangeDateInputProps> = inject(
    Angular.InputWidgetAdapter,
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
