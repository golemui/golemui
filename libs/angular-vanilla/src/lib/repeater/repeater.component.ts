import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type RepeaterProps = {
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  template: Core.FormField<string>;
};

@Component({
  standalone: true,
  selector: 'ff-repeater',
  imports: [CommonModule, Angular.RepeaterFieldDirective],
  providers: [Angular.ControlAdapter, Angular.RepeaterFieldDirective],
  templateUrl: './repeater.component.html',
  styleUrls: ['../styles.scss', './repeater.component.scss'],
})
export class RepeaterComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<Record<string, unknown>[]>;
  protected adapter: Angular.ControlAdapter<
    Record<string, unknown>[],
    RepeaterProps
  > = inject(Angular.ControlAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  addItem() {
    this.adapter.valueChanged([
      ...(this.adapter.templateData().value ?? []),
      {},
    ]);
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
