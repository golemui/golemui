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
import { type CurrencyProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-currency-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './currency.component.html',
  host: {
    class: 'gui-currency gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CurrencyComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<number>;
  protected adapter: InputWidgetAdapter<number, CurrencyProps> = inject(InputWidgetAdapter);

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
