import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { NumberinputProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-number-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './number.component.html',
  host: {
    class: 'gui-number',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NumberComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<number>;
  protected adapter: Angular.InputWidgetAdapter<number, NumberinputProps> = inject(
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
