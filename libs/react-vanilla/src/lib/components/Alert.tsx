import * as Core from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { AlertProps } from '@golemui/shared-vanilla';

export function Alert(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<AlertProps>(widget);

  return (
    <div className="gui-alert" style={{ flex: templateData.size }}>
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
