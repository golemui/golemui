import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { AlertProps } from '@golemui/gui-shared/internals';

export function Alert(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWidget<AlertProps>(widget);

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
