import * as Core from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { FlexProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function Flex(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<FlexProps>(widget);

  const renderWidgets = useCallback(() => {
    if (!children) return null;
    return children.map((widget) => (
      <WidgetRenderer key={widget.uid} widget={widget as Core.NonFunctionWidget<string>} />
    ));
  }, [children]);

  const direction = `gui-flex__widget--${templateData.direction ?? 'column'}`;
  const align = templateData.align ? `gui-flex__widget--align-${templateData.align as string}` : '';
  return (
    <div className="gui-flex" style={{ flex: templateData.size }}>
      <div className={`gui-flex__widget ${direction} ${align}`} style={templateData.gap ? { gap: `${templateData.gap}px`} : {}} id={uid}>
        {renderWidgets()}
      </div>
    </div>
  );
}
