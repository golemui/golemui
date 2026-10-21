import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import {
  DEFAULT_MENU_PLACEMENT,
  isMenuSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuPanelId,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import { GuiMenuReact } from '../web-components';
import '../styles.scss';

/**
 * The menu action widget: a button that opens a `gui-menu` of actions. Picking an item emits the
 * widget's `click` event with `{ value }` as its detail.
 */
export function Menu(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, emitClick } = useActionWidget<MenuProps>(widget);
  const { variant, icon, iconPosition } = templateData;
  const panelId = menuPanelId(uid);
  const iconPart = icon ? (
    <span
      className={`gui-widget-icon gui-button-icon ${icon}`}
      data-icon={icon}
      aria-hidden="true"
    />
  ) : null;
  const iconOnRight = iconPosition === 'right';

  return (
    <div className="gui-menu-button gui-field">
      <div className="gui-widget">
        <button
          type="button"
          id={uid}
          className={menuButtonClasses({ variant, icon, iconPosition })}
          data-cy={`${uid}_button`}
          popoverTarget={panelId}
          aria-label={menuButtonAriaLabel(templateData.label, templateData.ariaLabel)}
          disabled={templateData.disabled === true}
        >
          {iconOnRight ? null : iconPart}
          {templateData.label ? <span>{templateData.label as string}</span> : null}
          {iconOnRight ? iconPart : null}
        </button>
      </div>
      <GuiMenuReact
        placement={templateData.placement ?? DEFAULT_MENU_PLACEMENT}
        onGuiAction={(event) => emitClick({ value: event.detail.value })}
      >
        <div id={panelId} data-cy={panelId} popover="auto">
          {(templateData.items ?? []).map((item, index) =>
            isMenuSeparator(item) ? (
              <hr key={`separator-${index}`} />
            ) : (
              <button
                key={item.value}
                type="button"
                value={item.value}
                data-cy={`${uid}_item_${item.value}`}
                disabled={item.disabled === true}
              >
                {item.label as string}
              </button>
            ),
          )}
        </div>
      </GuiMenuReact>
    </div>
  );
}
