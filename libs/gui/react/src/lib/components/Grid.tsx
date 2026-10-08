import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import {
  type FlexProps,
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';
import '../styles.scss';

/** The grid layout, and the deprecated flex layout, which renders as a grid. */
export function Grid(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<GridProps & FlexProps>(widget);
  const grid = resolveGrid(widget.type, templateData);

  return (
    <div className="gui-field">
      <div className={gridClasses(grid)} id={uid}>
        {(children as NonFunctionWidget<string>[]).map((child) => (
          <div key={child.uid} className={gridCellClasses(grid, child.size)}>
            <WidgetRenderer widget={child} />
          </div>
        ))}
      </div>
    </div>
  );
}
