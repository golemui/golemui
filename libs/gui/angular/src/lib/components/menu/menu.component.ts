import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  DEFAULT_MENU_PLACEMENT,
  isMenuSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuPanelId,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/menu';
import { deferHydrationAttr } from '../../utils/defer-hydration';

/**
 * The menu action widget: a button that opens a `gui-menu` of actions. Picking an item emits the
 * widget's `click` event with `{ value }` as its detail.
 */
@Component({
  standalone: true,
  selector: 'gui-menu-interactive',
  providers: [ActionWidgetAdapter],
  templateUrl: './menu.component.html',
  host: {
    class: 'gui-menu-button gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MenuComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<MenuProps> = inject(ActionWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly defaultPlacement = DEFAULT_MENU_PLACEMENT;
  protected readonly isMenuSeparator = isMenuSeparator;
  protected readonly menuButtonClasses = menuButtonClasses;
  protected readonly menuButtonAriaLabel = menuButtonAriaLabel;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  get panelId() {
    return menuPanelId(this.widget.uid);
  }

  onAction(event: Event) {
    const { detail } = event as CustomEvent<GuiActionEventDetail>;
    this.adapter.click({ value: detail.value });
  }
}
