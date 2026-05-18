import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';
import { type ButtonProps } from '@golemui/gui-shared';
import '@golemui/gui-components/button';

@Component({
  standalone: true,
  selector: 'gui-button-interactive',
  providers: [ActionWidgetAdapter],
  templateUrl: './button.component.html',
  host: {
    class: 'gui-button gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ButtonComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<ButtonProps> = inject(ActionWidgetAdapter);

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
