import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type RepeaterProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-repeater-control',
  imports: [CommonModule, Angular.RepeaterWidgetDirective],
  providers: [Angular.InputWidgetAdapter, Angular.RepeaterWidgetDirective],
  templateUrl: './repeater.component.html',
  host: {
    class: 'gui-repeater gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RepeaterComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<Record<string, unknown>[]>;
  protected adapter: Angular.InputWidgetAdapter<
    Record<string, unknown>[],
    RepeaterProps<Core.NonFunctionWidget>
  > = inject(Angular.InputWidgetAdapter);

  isFocused = false;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  addItem() {
    const newValue = [...(this.adapter.templateData().value ?? []), {}];
    this.adapter.valueChanged(newValue);
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

  onFocusIn(event: FocusEvent) {
    event.stopPropagation();
    this.isFocused = true;
  }

  onFocusOut(event: FocusEvent) {
    event.stopPropagation();
    this.adapter.onBlur();
    this.isFocused = false;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
