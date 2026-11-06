import { toDomId } from '@golemui/core/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { MarkdownTextProps } from '@golemui/gui-shared/internals';
import { GuiMarkdownTextReact } from '../web-components';

export function MarkdownText(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { uid, formName, templateData } = useDisplayWidget<MarkdownTextProps>(widget);
  const domId = toDomId(formName, uid);

  return (
    <div className="gui-markdown-text gui-field">
      <div className="gui-widget" id={domId}>
        <GuiMarkdownTextReact md={templateData.md} dependencies={templateData.deps} />
      </div>
    </div>
  );
}
