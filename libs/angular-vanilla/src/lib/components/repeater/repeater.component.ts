import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { RepeaterProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-repeater',
  imports: [CommonModule, Angular.RepeaterFieldDirective],
  providers: [Angular.ControlFieldAdapter, Angular.RepeaterFieldDirective],
  templateUrl: './repeater.component.html',
  host: {
    class: 'gui-repeater',
  },
})
export class RepeaterComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<Record<string, unknown>[]>;
  protected adapter: Angular.ControlFieldAdapter<Record<string, unknown>[], RepeaterProps> = inject(
    Angular.ControlFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  addItem() {
    this.adapter.valueChanged([...(this.adapter.templateData().value ?? []), {}]);
  }

  removeItem(index: number) {
    const arr = [...(this.adapter.templateData().value ?? [])];
    arr.splice(index, 1);
    this.adapter.valueChanged(arr);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
