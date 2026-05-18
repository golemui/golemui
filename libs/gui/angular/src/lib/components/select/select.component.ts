import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type SelectProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-select-control',
  imports: [CommonModule],
  providers: [Angular.InputWidgetAdapter],
  templateUrl: './select.component.html',
  host: {
    class: 'gui-select gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SelectComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.InputWidget<string>;
  protected adapter: Angular.InputWidgetAdapter<string, SelectProps> = inject(
    Angular.InputWidgetAdapter,
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
