import type { ActionWidget, WithWidget } from '@golemui/core'
import { useActionWidget } from '@golemui/react';
import '../styles.scss';
import { type ButtonProps } from '@golemui/gui-shared';

export function Button(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, onClick } = useActionWidget<ButtonProps>(widget);

  return (
    <div className="gui-button gui-field" style={{ flex: templateData.size }}>
      <gui-button
        uid={uid}
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
