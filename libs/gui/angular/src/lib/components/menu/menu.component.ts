import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActionWidgetAdapter } from '@golemui/angular';
import type { ActionWidget, WithWidget } from '@golemui/core';
import type { GuiActionEventDetail, GuiMenuToggleEventDetail } from '@golemui/gui-components';
import {
  isMenuGroup,
  menuGroupId,
  menuItemCy,
  menuOpenGroups,
  toggleMenuGroup,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/menu';
import { deferHydrationAttr } from '../../utils/defer-hydration';

/**
 * The menu action widget: a navigation menu, with `gui-menu`. Picking a destination emits the
 * widget's `click` event with `{ value }` as its detail; a group's button only opens the group.
 * The groups that hold `current` open when it changes, and the user's own toggles stay until then.
 */
@Component({
  standalone: true,
  selector: 'gui-menu-interactive',
  providers: [ActionWidgetAdapter],
  imports: [NgTemplateOutlet],
  templateUrl: './menu.component.html',
  host: {
    class: 'gui-menu gui-field',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MenuComponent implements OnInit, OnDestroy, WithWidget {
  widget!: ActionWidget;
  protected adapter: ActionWidgetAdapter<MenuProps> = inject(ActionWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();
  protected readonly isMenuGroup = isMenuGroup;
  protected readonly menuItemCy = menuItemCy;

  /** The values of the groups open in place. */
  private open: string[] = [];
  /** The `current` the open groups last followed. */
  private followed: unknown = undefined;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  protected groupId(value: string) {
    return menuGroupId(this.adapter.domId, value);
  }

  /** The groups open in place: the way to `current` opens whenever it changes. */
  protected openGroups(templateData: MenuProps): string[] {
    if (templateData.current !== this.followed) {
      this.followed = templateData.current;
      this.open = menuOpenGroups(this.open, templateData.items, templateData.current);
    }
    return this.open;
  }

  protected name(label: unknown): string | null {
    return typeof label === 'string' && label !== '' ? label : null;
  }

  onAction(event: Event) {
    const { detail } = event as CustomEvent<GuiActionEventDetail>;
    this.adapter.click({ value: detail.value });
  }

  // The element has opened or closed the group already: the state follows it.
  onToggle(event: Event) {
    const { detail } = event as CustomEvent<GuiMenuToggleEventDetail>;
    this.open = toggleMenuGroup(this.open, detail.value, detail.open);
  }
}
