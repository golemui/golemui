import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';

type OwnWidgetProps = {
  title?: string;
};

/** A custom layout widget that shows its `title` prop and renders its children. */
export function CustomLayout(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData } = useLayoutWidget<OwnWidgetProps>(widget);

  return (
    <section id={uid} data-cy="custom-layout">
      <h4 data-cy="custom-layout-title">{templateData.title}</h4>
      {(children as NonFunctionWidget<string>[]).map((child) => (
        <WidgetRenderer key={child.uid} widget={child} />
      ))}
    </section>
  );
}
