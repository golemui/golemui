import { toDomId } from '@golemui/core/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { RendererProps } from '@golemui/gui-shared/internals';
import { type ReactNode } from 'react';

export function Renderer(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, formName, templateData } = useDisplayWidget<RendererProps<ReactNode>>(widget);
  const domId = toDomId(formName, uid);
  const renderedElement = templateData?.render;
  return (
    <div className="gui-renderer gui-field">
      <div className="gui-widget" id={domId}>
        {renderedElement}
      </div>
    </div>
  );
}
