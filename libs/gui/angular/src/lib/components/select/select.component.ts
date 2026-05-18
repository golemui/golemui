import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, type OnDestroy, type OnInit } from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular'
import type { InputWidget, WithWidget } from '@golemui/core'
import { type SelectProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-select-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './select.component.html',
  host: {
    class: 'gui-select gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SelectComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, SelectProps> = inject(
    InputWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    this.adapter.injectValidationIssues(null);
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }
}
