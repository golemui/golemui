import * as Core from '@formforge/core';
import { useControl } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';
import { TextinputProps } from '@formforge/shared-vanilla';

export function TextInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, isRequired, value, isDisabled, isReadonly, label, onValueChanged } = useControl<
    string,
    TextinputProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onValueChanged(e.target.value),
    [onValueChanged],
  );

  const hint = field.props?.hint;
  const placeholder = field.props?.placeholder;
  const icon = field.props?.icon;
  const iconPosition = field.props?.iconPosition;

  return (
    <div className="ff-textinput">
      <label htmlFor={uid}>
        {label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="ff-textinput__hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="ff-field">
        <input
          type="text"
          id={uid}
          className={`${icon ? 'ff-textinput--icon' : ''} ${iconPosition === 'right' ? 'ff-textinput--icon-right' : ''}`}
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
            className={`${icon} ff-textinput__icon ${iconPosition === 'right' ? 'ff-textinput__icon--right' : ''}`}
          ></span>
        )}
      </div>
    </div>
  );
}
