import * as Core from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { RendererProps } from '@golemui/gui-shared';
import { ReactNode } from 'react';

export function Renderer(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.DisplayWidget;
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
