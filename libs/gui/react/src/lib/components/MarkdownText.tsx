import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { type MarkdownTextProps } from '@golemui/gui-shared';
import { GuiMarkdownTextReact } from '../web-components';


export function MarkdownText(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<MarkdownTextProps>(widget);

  return (
    <div className="gui-markdown-text gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        <GuiMarkdownTextReact md={templateData.md} dependencies={templateData.deps} />
      </div>
    </div>
  );
}
