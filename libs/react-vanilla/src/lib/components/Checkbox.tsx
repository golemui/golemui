import * as Core from '@formforge/core';
import { useControl } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

export function Checkbox(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, isRequired, value, isDisabled, label, onValueChanged } =
    useControl(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged(e.target.checked),
    [onValueChanged],
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
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
