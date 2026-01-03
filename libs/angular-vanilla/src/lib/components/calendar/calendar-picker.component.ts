import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CalendarProps, GuiCalendarPickerControl } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';

@Component({
  standalone: true,
  selector: 'gui-calendar-picker',
  imports: [CommonModule, ErrorsComponent],
  templateUrl: './calendar-picker.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CalendarPickerComponent implements Core.WithField {
  calendarRef!: GuiCalendarPickerControl;
  field!: Core.ControlField<string>;
  adapter = input.required<Angular.ControlFieldAdapter<string, CalendarProps>>();
  currentDate = input.required<Date>();

  onChangeDate(event: Event) {
    this.adapter().valueChanged((event as CustomEvent).detail.value);
  }
}
