import * as Core from '@golemui/core';
import { useDisplayField } from '@golemui/react';
import { RendererProps } from '@golemui/shared-vanilla';

export function Renderer(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.DisplayField;
  const { uid, templateData } = useDisplayField<RendererProps>(field);

  const renderedElement = templateData?.render;
  //console.log(renderFn);

  return (
    <div className="gui-renderer">
      <div className="gui-field" id={uid}>
        {renderedElement}
      </div>
    </div>
  );
}
