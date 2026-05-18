import type * as Core from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { type MarkdownTextProps } from '@golemui/gui-shared';

export function MarkdownText(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<MarkdownTextProps>(widget);

  return (
    <div className="gui-markdown-text gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        <gui-markdown-text md={templateData.md} dependencies={templateData.deps} />
      </div>
    </div>
  );
}
