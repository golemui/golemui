import type { LayoutWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import {
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';
import '../styles.scss';

export function Grid(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { domId, children, templateData } = useLayoutWidget<GridProps>(widget);
  const grid = resolveGrid(templateData);

  return (
    <div className="gui-field">
      <div className={gridClasses(grid)} id={domId}>
        {children.map((child) => (
          <div key={child.uid} className={gridCellClasses(grid, child.size)}>
            <WidgetRenderer widget={child} />
          </div>
        ))}
      </div>
    </div>
  );
}
