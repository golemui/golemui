import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import type { BadgeProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/badge';

export function Badge(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { domId, templateData } = useDisplayWidget<BadgeProps>(widget);

  // The plain tag, not the React wrapper: a server render then has the variant as an attribute.
  return (
    <div className="gui-badge gui-field">
      <gui-badge id={domId} variant={templateData.level || 'default'}>
        {templateData.text as string}
      </gui-badge>
    </div>
  );
}
