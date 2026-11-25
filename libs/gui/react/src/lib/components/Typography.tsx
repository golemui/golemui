import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import {
  typographyClasses,
  typographyTag,
  type TypographyProps,
} from '@golemui/gui-shared/internals';

export function Typography(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { domId, templateData } = useDisplayWidget<TypographyProps>(widget);
  const Tag = typographyTag(templateData.variant);

  return (
    <div className="gui-typography-field gui-field">
      <Tag id={domId} className={typographyClasses(templateData.variant)}>
        {templateData.text as string}
      </Tag>
    </div>
  );
}
