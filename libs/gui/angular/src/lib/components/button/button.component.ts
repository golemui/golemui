import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';
import { tooltipId, tooltipText, type ButtonProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/button';
import '@golemui/gui-components/tooltip';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-button-interactive',
  providers: [ActionWidgetAdapter],
  templateUrl: './button.component.html',
  host: {
    class: 'gui-button gui-field',
    '[class.gui-button--invalid]':
      "this.adapter.templateData().invalid === true && this.adapter.templateData().actionType === 'submit'",
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ButtonComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<ButtonProps> = inject(ActionWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  /** The text of the button's tooltip, or undefined for none. */
  protected readonly tooltip = computed(() => tooltipText(this.adapter.templateData().tooltip));

  get tipId() {
    return tooltipId(this.adapter.domId);
  }

  onClick() {
    this.adapter.click();
  }
}
