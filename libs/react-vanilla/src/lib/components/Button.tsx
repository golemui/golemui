import * as Core from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import '../styles.scss';

export function Button(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.ActionWidget;
  const { uid, templateData, onClick } = useActionWidget(widget);
  const isDisabled = templateData.disabled as boolean;

  return (
    <div className="gui-button" style={{ flex: templateData.size }}>
      <div className="gui-field">
        <button
          type="button"
          id={uid}
          data-cy={`${uid}_button`}
          onClick={onClick}
          disabled={isDisabled}
        >
          {templateData.label as string}
        </button>
      </div>
    </div>
  );
}
