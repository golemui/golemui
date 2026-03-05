import * as Core from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import '../styles.scss';
import { ButtonProps } from '@golemui/gui-shared';

export function Button(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.ActionWidget;
  const { uid, templateData, onClick } = useActionWidget<ButtonProps>(widget);
  const isDisabled = templateData.disabled as boolean;
  const icon = templateData.icon;
  const label = templateData.label as string;
  const iconPosition = templateData.iconPosition || 'left';

  const iconElement = icon ? <span className={`gui-button-icon ${icon}`}></span> : null;

  return (
    <div
      className={`gui-button ${icon ? 'gui-button-with-icon' : ''} gui-button-icon-${iconPosition}`}
      style={{ flex: templateData.size }}
    >
      <div className="gui-widget">
        <button
          type="button"
          id={uid}
          data-cy={`${uid}_button`}
          onClick={onClick}
          disabled={isDisabled}
        >
          {iconPosition === 'left' && iconElement}
          {label && <span>{label}</span>}
          {iconPosition === 'right' && iconElement}
        </button>
      </div>
    </div>
  );
}
