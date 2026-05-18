import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { ButtonProps } from '@golemui/gui-shared';
import '@golemui/gui-components/button';

@Component({
  standalone: true,
  selector: 'gui-button-interactive',
  providers: [Angular.ActionWidgetAdapter],
  templateUrl: './button.component.html',
  host: {
    class: 'gui-button gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ButtonComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.ActionWidget;
  protected adapter: Angular.ActionWidgetAdapter<ButtonProps> = inject(Angular.ActionWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onClick() {
    this.adapter.click();
  }
}
