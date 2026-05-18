import type { InputWidget, WithWidget } from '@golemui/core'
import { useInputWidget } from '@golemui/react';

export function SimpleInputComponent(fieldInstance: WithWidget) {
  const widget = fieldInstance.widget as InputWidget<string, string>;
  const { uid, value, errors, isTouched, onValueChanged, onBlur } = useInputWidget<
    string,
    Record<string, any>
  >(widget);

  const isDisabled = typeof widget.disabled === 'boolean' ? widget.disabled : false;
  const isReadonly = typeof widget.readonly === 'boolean' ? widget.readonly : false;
  const labelText = typeof widget.label === 'string' ? widget.label : undefined;

  return (
    <div id={uid} style={{ marginBottom: '8px' }}>
      {labelText && (
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          {labelText}
        </label>
      )}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onValueChanged(e.target.value)}
        onBlur={onBlur}
        disabled={isDisabled}
        readOnly={isReadonly}
        style={{
          padding: '8px 12px',
          border: `1px solid ${isTouched && errors.length > 0 ? '#d32f2f' : '#ccc'}`,
          borderRadius: '4px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {isTouched && errors.length > 0 && (
        <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
          {errors.join(', ')}
        </div>
      )}
    </div>
  );
}
