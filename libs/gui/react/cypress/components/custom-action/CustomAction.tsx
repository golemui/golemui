import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';

/** A custom action widget: a native button that sends the click of the widget. */
export function CustomAction(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, onClick } = useActionWidget<{ label?: string }>(widget);

  return (
    <button id={uid} type="button" data-cy="custom-action" onClick={onClick}>
      {templateData.label}
    </button>
  );
}
