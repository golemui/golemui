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
import type { TimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/time-picker';

@Component({
  standalone: true,
  selector: 'gui-time-picker-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './time-picker.component.html',
  host: {
    class: 'gui-time-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TimePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, TimePickerProps> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  protected onChangeTime(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  protected onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
