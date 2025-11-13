import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CheckboxProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-checkbox',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './checkbox.component.html',
  host: {
    class: 'gui-checkbox',
    '[class.gui-checkbox--left]': 'adapter.templateData().checkboxPosition === "left"',
  },
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
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.checked);
  }
}
