import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { RepeaterProps } from '@golemui/gui-components';

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
  protected adapter: Angular.InputWidgetAdapter<
    Record<string, unknown>[],
    RepeaterProps<Core.NonFunctionWidget>
  > = inject(Angular.InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  addItem() {
    this.adapter.valueChanged([...(this.adapter.templateData().value ?? []), {}]);
  }

  removeItem(index: number) {
    const items = (this.adapter.templateData().value ?? []).filter((_, i) => index !== i);
    // Make sure we don't keep object references
    if ('structuredClone' in window) {
      this.adapter.valueChanged(structuredClone(items));
    } else {
      this.adapter.valueChanged(JSON.parse(JSON.stringify(items)));
    }
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
