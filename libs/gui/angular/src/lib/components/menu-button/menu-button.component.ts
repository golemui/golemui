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
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  DEFAULT_MENU_BUTTON_PLACEMENT,
  isMenuButtonSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuButtonPanelId,
  tooltipId,
  tooltipText,
  type MenuButtonProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/menu-button';
import '@golemui/gui-components/tooltip';
import { deferHydrationAttr } from '../../utils/defer-hydration';

/**
 * The menuButton action widget: a button that opens a menu of actions, with `gui-menu-button`.
 * Picking an item emits the widget's `click` event with `{ value }` as its detail.
 */
@Component({
  standalone: true,
  selector: 'gui-menu-button-interactive',
  providers: [ActionWidgetAdapter],
  templateUrl: './menu-button.component.html',
  host: {
    class: 'gui-menu-button gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MenuButtonComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<MenuButtonProps> = inject(ActionWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly defaultPlacement = DEFAULT_MENU_BUTTON_PLACEMENT;
  protected readonly isMenuButtonSeparator = isMenuButtonSeparator;
  protected readonly menuButtonClasses = menuButtonClasses;
  protected readonly menuButtonAriaLabel = menuButtonAriaLabel;

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

  get panelId() {
    return menuButtonPanelId(this.adapter.domId);
  }

  /** The `data-cy` of the panel, built from the bare uid. */
  get panelCy() {
    return menuButtonPanelId(this.widget.uid);
  }

  onAction(event: Event) {
    const { detail } = event as CustomEvent<GuiActionEventDetail>;
    this.adapter.click({ value: detail.value });
  }
}
