import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
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
import { GuiMenuButtonReact, GuiTooltipReact } from '../web-components';
import '../styles.scss';

/**
 * The menuButton action widget: a button that opens a menu of actions, with `gui-menu-button`.
 * Picking an item emits the widget's `click` event with `{ value }` as its detail.
 */
export function MenuButton(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, domId, templateData, emitClick } = useActionWidget<MenuButtonProps>(widget);
  const { variant, icon, iconPosition } = templateData;
  const panelId = menuButtonPanelId(domId);
  const tooltip = tooltipText(templateData.tooltip);
  const tipId = tooltipId(domId);
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
          id={domId}
          className={menuButtonClasses({ variant, icon, iconPosition })}
          data-cy={`${uid}_button`}
          popoverTarget={panelId}
          aria-label={menuButtonAriaLabel(templateData.label, templateData.ariaLabel)}
          aria-describedby={tooltip ? tipId : undefined}
          disabled={templateData.disabled === true}
        >
          {iconOnRight ? null : iconPart}
          {templateData.label ? <span>{templateData.label as string}</span> : null}
          {iconOnRight ? iconPart : null}
        </button>
      </div>
      {tooltip ? (
        <GuiTooltipReact id={tipId} role="tooltip" popover="manual" htmlFor={domId}>
          {tooltip}
        </GuiTooltipReact>
      ) : null}
      <GuiMenuButtonReact
        placement={templateData.placement ?? DEFAULT_MENU_BUTTON_PLACEMENT}
        onGuiAction={(event) => emitClick({ value: event.detail.value })}
      >
        <div id={panelId} data-cy={menuButtonPanelId(uid)} popover="auto">
          {(templateData.items ?? []).map((item, index) =>
            isMenuButtonSeparator(item) ? (
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
      </GuiMenuButtonReact>
    </div>
  );
}
