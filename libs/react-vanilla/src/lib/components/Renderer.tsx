import * as Core from '@golemui/core';
import { useDisplayField } from '@golemui/react';
import { RendererProps } from '@golemui/shared-vanilla';
import { ReactNode } from 'react';

export function Renderer(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.DisplayWidget;
  const { uid, templateData } = useDisplayField<RendererProps<ReactNode>>(field);
  const renderedElement = templateData?.render;
  return (
    <div className="gui-renderer">
      <div className="gui-field" id={uid}>
        {renderedElement}
      </div>
    </div>
  );
}
