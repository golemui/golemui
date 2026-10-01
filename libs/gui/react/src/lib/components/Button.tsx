import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import { GuiButtonReact } from '../web-components';
import '../styles.scss';
import type { ButtonProps } from '@golemui/gui-shared/internals';

export function Button(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, onClick } = useActionWidget<ButtonProps>(widget);
  const invalid = templateData.invalid === true && templateData.actionType === 'submit';

  return (
    <div
      className={invalid ? 'gui-button gui-field gui-button--invalid' : 'gui-button gui-field'}
      style={{ flex: templateData.size }}
    >
      <GuiButtonReact
        uid={uid}
        type={templateData.actionType ?? 'button'}
        label={templateData.label as string}
        disabled={templateData.disabled as boolean}
        variant={templateData.variant}
        icon={templateData.icon}
        iconPosition={templateData.iconPosition}
        onClick={onClick}
      />
    </div>
  );
}
