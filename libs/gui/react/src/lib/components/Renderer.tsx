import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { RendererProps } from '@golemui/gui-shared/internals';
import { type ReactNode } from 'react';

export function Renderer(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWidget<RendererProps<ReactNode>>(widget);
  const renderedElement = templateData?.render;
  return (
    <div className="gui-renderer gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        {renderedElement}
      </div>
    </div>
  );
}
