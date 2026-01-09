import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { DatePickerProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-date-control',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './date.component.html',
  host: {
    class: 'gui-date',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DateComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, DatePickerProps> = inject(
    Angular.ControlFieldAdapter,
  );
  currentDate = new Date();

  // TODO: Get localeId from i18n feature
  localeId = 'es';

  ngOnInit(): void {
    this.adapter.init(this.field);
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
