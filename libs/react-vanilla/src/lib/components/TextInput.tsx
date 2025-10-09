import * as Core from '@formforge/core';
import { useControl } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

export function TextInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, isRequired, value, isDisabled, label, onValueChanged } =
    useControl(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onValueChanged(e.target.value),
    [onValueChanged],
  );

  return (
    <ff-textinput>
      <div className="field">
        {label && <label htmlFor={uid}>{label + (isRequired ? ' *' : '')}</label>}
        <input
          type="text"
          id={uid}
          value={value ?? ''}
          disabled={isDisabled}
          onInput={handleChange}
        />
      </div>
    </ff-textinput>
  );
}
