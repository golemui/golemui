import * as Core from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import '@golemui/gui-components/button';
import '../styles.scss';
import { ButtonProps } from '@golemui/gui-shared';

export function Button(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.ActionWidget;
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
