import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { OptionValue, RadiogroupProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-radiogroup-control',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './radiogroup.component.html',
  host: {
    class: 'gui-radiogroup',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RadiogroupComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<OptionValue, RadiogroupProps> = inject(
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
