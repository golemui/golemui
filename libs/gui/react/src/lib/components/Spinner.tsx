import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { SpinnerProps } from '@golemui/gui-shared/internals';
import { GuiSpinnerReact } from '../web-components';

export function Spinner(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { domId, templateData } = useDisplayWidget<SpinnerProps>(widget);

  return (
    <div className="gui-spinner gui-field">
      <GuiSpinnerReact id={domId} label={templateData.label as string | undefined} />
    </div>
  );
}
