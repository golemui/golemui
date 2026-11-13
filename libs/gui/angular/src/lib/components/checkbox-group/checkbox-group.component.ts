import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { CheckboxGroupProps, OptionValue } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/checkbox-group';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-checkbox-group-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './checkbox-group.component.html',
  host: {
    class: 'gui-checkbox-group gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckboxGroupComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<OptionValue[]>;
  protected adapter: InputWidgetAdapter<OptionValue[], CheckboxGroupProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }
}
