import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { ProgressProps } from '@golemui/gui-shared/internals';
import { GuiProgressReact } from '../web-components';

export function Progress(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, formName, templateData } = useDisplayWidget<ProgressProps>(widget);

  return (
    <div className="gui-progress gui-field">
      <GuiProgressReact
        uid={uid}
        idPrefix={formName}
        label={templateData.label as string}
        value={templateData.value}
        max={templateData.max}
        showValue={templateData.showValue}
        localeId={templateData.lang}
      />
    </div>
  );
}
