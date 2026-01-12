import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { NumberinputProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-number-control',
  imports: [CommonModule],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './number.component.html',
  host: {
    class: 'gui-number',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NumberComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<number>;
  protected adapter: Angular.ControlFieldAdapter<number, NumberinputProps> = inject(
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
