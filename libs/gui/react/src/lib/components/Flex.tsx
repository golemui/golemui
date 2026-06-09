import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import type { FlexProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';

export function Flex(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<FlexProps>(widget);

  const renderWidgets = useCallback(() => {
    if (!children) return null;
    return children.map((widget) => (
      <WidgetRenderer key={widget.uid} widget={widget as NonFunctionWidget<string>} />
    ));
  }, [children]);

  const direction = `gui-flex__widget--${templateData.direction ?? 'column'}`;
  const justify = `gui-flex__widget--justify-${(templateData.justify as string) ?? 'stretch'}`;
  const align = `gui-flex__widget--align-${(templateData.align as string) ?? 'start'}`;
  return (
    <div className="gui-flex gui-field" style={{ flex: templateData.size }}>
      <div
        className={`gui-flex__widget ${direction} ${justify} ${align}`}
        style={templateData.gap ? { gap: `${templateData.gap}px` } : {}}
        id={uid}
      >
        {renderWidgets()}
      </div>
    </div>
  );
}
