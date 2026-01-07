import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { LabelComponent } from '../../utils/templates/label.component';
import { ErrorsComponent } from '../../utils/templates/errors.component';

@Component({
  standalone: true,
  selector: 'gui-checkbox-control',
  imports: [CommonModule, LabelComponent, ErrorsComponent],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './checkbox.component.html',
  host: {
    class: 'gui-checkbox',
    '[class.gui-checkbox--left]': 'adapter.templateData().checkboxPosition === "left"',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckboxComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, CheckboxProps> = inject(
    Angular.ControlFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
