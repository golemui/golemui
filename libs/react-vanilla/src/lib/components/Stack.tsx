import * as Core from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { StackProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Stack(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<StackProps>(widget);

  const renderWidgets = useCallback(() => {
    return children.map((widget) => (
      <WidgetRenderer key={widget.uid} widget={widget as Core.NonFunctionWidget<string>} />
    ));
  }, [children]);

  const direction = templateData.direction === 'horizontal' ? 'gui-stack__widget--horizontal' : '';
  return (
    <div className="gui-stack" style={{ flex: templateData.size }}>
      <div className={`gui-stack__widget ${direction}`} id={uid}>
        {renderWidgets()}
      </div>
    </div>
  );
}
