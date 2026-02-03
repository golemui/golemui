import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-calendar-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './calendar.component.html',
  host: {
    class: 'gui-calendar',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CalendarComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<string>;
  protected adapter: Angular.InputWidgetAdapter<string, CalendarProps> = inject(
    Angular.InputWidgetAdapter,
  );

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
