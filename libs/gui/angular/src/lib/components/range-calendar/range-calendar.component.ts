import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { RangeCalendarProps } from '@golemui/gui-shared';
import '@golemui/gui-components/range-calendar';

@Component({
  standalone: true,
  selector: 'gui-range-calendar-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './range-calendar.component.html',
  host: {
    class: 'gui-range-calendar gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeCalendarComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<string>;
  protected adapter: Angular.InputWidgetAdapter<string, RangeCalendarProps> = inject(
    Angular.InputWidgetAdapter,
  );
  currentDate = new Date();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
