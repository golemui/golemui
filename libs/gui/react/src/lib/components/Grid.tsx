import * as Core from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { GridProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function Grid(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<GridProps>(widget);

  const isRow = templateData.direction === 'row';

  const renderWidgets = useCallback(() => {
    return children.map((child) => {
      const widget = child as Core.NonFunctionWidget<string>;
      return (
        <div key={widget.uid} className="gui-grid__cell" style={{ gridColumn: `span ${widget.size || 1}` }}>
          <WidgetRenderer widget={widget} />
        </div>
      );
    });
  }, [children]);

  const direction = isRow ? 'gui-grid__widget--row' : 'gui-grid__widget--column';
  const align = templateData.align ? `gui-grid__widget--align-${templateData.align as string}` : '';
  const justify = templateData.justify ? `gui-grid__widget--justify-${templateData.justify as string}` : '';

  const style: React.CSSProperties = {};
  if (templateData.columnGap !== undefined) style.columnGap = `${templateData.columnGap}px`;
  if (templateData.rowGap !== undefined) style.rowGap = `${templateData.rowGap}px`;

  return (
    <div className="gui-grid gui-field" style={{ flex: templateData.size }}>
      <div className={`gui-grid__widget ${direction} ${isRow && templateData.autoFit ? 'gui-grid__widget--row--auto-fit' : ''} ${align} ${justify}`} style={style} id={uid}>
        {renderWidgets()}
      </div>
    </div>
  );
}
