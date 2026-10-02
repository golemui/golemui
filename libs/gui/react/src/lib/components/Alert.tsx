import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { AlertProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/alert';

export function Alert(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWidget<AlertProps>(widget);

  // The plain tag, not the React wrapper: a server render then has the variant as an attribute.
  return (
    <div className="gui-alert gui-field" style={{ flex: templateData.size }}>
      <gui-alert id={uid} variant={templateData.level || 'default'}>
        {templateData.text}
      </gui-alert>
    </div>
  );
}
