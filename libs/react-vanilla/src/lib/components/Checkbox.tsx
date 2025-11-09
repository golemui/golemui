import * as Core from '@formforge/core';
import { useControl } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

export function Checkbox(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, isRequired, value, isDisabled, isReadonly, label, onValueChanged } =
    useControl(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => !isReadonly && onValueChanged(e.target.checked),
    [onValueChanged, isReadonly],
  );

  const checkboxPosition = field.props?.checkboxPosition;

  return (
    <div className={`ff-checkbox ${checkboxPosition === 'left' ? 'ff-checkbox--left' : ''}`}>
      <label htmlFor={uid}>{label + (isRequired ? ' *' : '')}</label>

      <div className="ff-field ff-field--horizontal">
        <input
          type="checkbox"
          id={uid}
          checked={value ?? false}
          disabled={isDisabled}
          aria-checked={value ?? false}
          aria-readonly={isReadonly}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
