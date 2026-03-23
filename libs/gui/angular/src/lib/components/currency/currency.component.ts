import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { CurrencyProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-currency-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './currency.component.html',
  host: {
    class: 'gui-currency gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CurrencyComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<number>;
  protected adapter: Angular.InputWidgetAdapter<number, CurrencyProps> = inject(
    Angular.InputWidgetAdapter,
  );

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
