import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter, RepeaterWidgetDirective } from '@golemui/angular';
import type { InputWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import type { RepeaterProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/label';
import '@golemui/gui-components/errors';

@Component({
  standalone: true,
  selector: 'gui-repeater-control',
  imports: [CommonModule, RepeaterWidgetDirective],
  providers: [InputWidgetAdapter, RepeaterWidgetDirective],
  templateUrl: './repeater.component.html',
  host: {
    class: 'gui-repeater gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RepeaterComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<Record<string, unknown>[]>;
  protected adapter: InputWidgetAdapter<
    Record<string, unknown>[],
    RepeaterProps<NonFunctionWidget>
  > = inject(InputWidgetAdapter);

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
