import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import { GuiButtonReact, GuiTooltipReact } from '../web-components';
import '../styles.scss';
import { tooltipId, tooltipText, type ButtonProps } from '@golemui/gui-shared/internals';

export function Button(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, domId, formName, templateData, onClick } = useActionWidget<ButtonProps>(widget);
  const invalid = templateData.invalid === true && templateData.actionType === 'submit';
  const tooltip = tooltipText(templateData.tooltip);
  const tipId = tooltipId(domId);

  return (
    <div className={invalid ? 'gui-button gui-field gui-button--invalid' : 'gui-button gui-field'}>
      <GuiButtonReact
        uid={uid}
        idPrefix={formName}
        type={templateData.actionType ?? 'button'}
        label={templateData.label as string}
        disabled={templateData.disabled as boolean}
        variant={templateData.variant}
        icon={templateData.icon}
        iconPosition={templateData.iconPosition}
        buttonAriaLabel={templateData.ariaLabel as string}
        aria-describedby={tooltip ? tipId : undefined}
        onClick={onClick}
      />
      {tooltip ? (
        <GuiTooltipReact id={tipId} role="tooltip" popover="manual" htmlFor={domId}>
          {tooltip}
        </GuiTooltipReact>
      ) : null}
    </div>
  );
}
