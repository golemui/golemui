import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { RangeCalendarProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-range-calendar-control',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './range-calendar.component.html',
  host: {
    class: 'gui-range-calendar',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeCalendarComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, RangeCalendarProps> = inject(
    Angular.ControlFieldAdapter,
  );
  currentDate = new Date();

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  onChangeDate(event: Event) {
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
