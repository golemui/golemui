import type { ActionWidget, WithWidget } from '@golemui/core'
import { useActionWidget } from '@golemui/react';

export function SimpleButtonComponent(fieldInstance: WithWidget) {
  const widget = fieldInstance.widget as ActionWidget<string>;
  const { uid, onClick } = useActionWidget<Record<string, any>>(widget);

  const isDisabled = typeof widget.disabled === 'boolean' ? widget.disabled : false;
  const labelText = typeof widget.label === 'string' ? widget.label : 'Action';

  return (
    <button
      type="button"
      id={uid}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        padding: '10px 24px',
        backgroundColor: isDisabled ? '#ccc' : '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {labelText}
    </button>
  );
}
