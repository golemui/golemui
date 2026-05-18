import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { type AlertProps } from '@golemui/gui-shared';

export function Alert(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<AlertProps>(widget);

  return (
    <div className="gui-alert gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        <div
          role="alert"
          className={`gui-alert-notification gui-alert-notification--${templateData.level || 'default'}`}
        >
          {templateData.text}
        </div>
      </div>
    </div>
  );
}
