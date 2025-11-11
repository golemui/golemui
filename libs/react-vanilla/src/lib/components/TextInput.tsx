import * as Core from '@golemui/core';
import { useControl } from '@golemui/react';
import { TextinputProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function TextInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, isRequired, value, isDisabled, isReadonly, label, props, onValueChanged } =
    useControl<string, TextinputProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onValueChanged(e.target.value),
    [onValueChanged],
  );

  const hint = props.hint;
  const placeholder = props.placeholder;
  const icon = props.icon;
  const iconPosition = props.iconPosition;

  return (
    <div className="gui-textinput">
      <label htmlFor={uid}>
        {label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-textinput__hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <input
          type="text"
          id={uid}
          className={`${icon ? 'gui-textinput--icon' : ''} ${iconPosition === 'right' ? 'gui-textinput--icon-right' : ''}`}
          value={value ?? ''}
          disabled={isDisabled}
          readOnly={isReadonly}
          placeholder={placeholder ?? undefined}
          onInput={handleChange}
          aria-required={isRequired}
          aria-describedby={hint ? `${uid}_hint` : undefined}
        />
        {icon && (
          <span
            className={`${icon} gui-textinput__icon ${iconPosition === 'right' ? 'gui-textinput__icon--right' : ''}`}
          ></span>
        )}
      </div>
    </div>
  );
}
