import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { RepeaterProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-repeater-control',
  imports: [CommonModule, Angular.RepeaterWidgetDirective],
  providers: [Angular.InputWidgetAdapter, Angular.RepeaterWidgetDirective],
  templateUrl: './repeater.component.html',
  host: {
    class: 'gui-repeater',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class RepeaterComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<Record<string, unknown>[]>;
  protected adapter: Angular.InputWidgetAdapter<Record<string, unknown>[], RepeaterProps> = inject(
    Angular.InputWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
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
