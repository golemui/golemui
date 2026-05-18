import type { DisplayWidget, WithWidget } from '@golemui/core'
import { useDisplayWdiget } from '@golemui/react';
import { type RendererProps } from '@golemui/gui-shared';
import { type ReactNode } from 'react';

export function Renderer(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<RendererProps<ReactNode>>(widget);
  const renderedElement = templateData?.render;
  return (
    <div className="gui-renderer gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        {renderedElement}
      </div>
    </div>
  );
}
