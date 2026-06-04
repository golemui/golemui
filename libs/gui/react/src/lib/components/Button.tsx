import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import { GuiButtonReact } from '../web-components';
import '../styles.scss';
import { type ButtonProps } from '@golemui/gui-shared';


export function Button(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, onClick } = useActionWidget<ButtonProps>(widget);

  return (
    <div className="gui-button gui-field" style={{ flex: templateData.size }}>
      <GuiButtonReact
        uid={uid}
        actionType={templateData.actionType ?? 'button'}
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
