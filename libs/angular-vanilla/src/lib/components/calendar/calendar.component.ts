import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import { CalendarPickerComponent } from './calendar-picker.component';

@Component({
  standalone: true,
  selector: 'gui-calendar',
  imports: [CommonModule, ErrorsComponent, LabelComponent, CalendarPickerComponent],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './calendar.component.html',
  host: {
    class: 'gui-calendar',
  },
})
export class CalendarComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, CalendarProps> = inject(
    Angular.ControlFieldAdapter,
  );
  currentDate = new Date();

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
