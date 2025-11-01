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

  return (
    <div className="ff-checkbox">
      <div className="field horizontal">
        {label && <label htmlFor={uid}>{label + (isRequired ? ' *' : '')}</label>}
        <input
          type="checkbox"
          id={uid}
          checked={value ?? false}
          disabled={isDisabled}
          aria-readonly={isReadonly}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
