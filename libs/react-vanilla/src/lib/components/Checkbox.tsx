import * as Core from '@golemui/core';
import { useControl } from '@golemui/react';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function Checkbox(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const {
    uid,
    validator,
    errors,
    value,
    isDisabled,
    isReadonly,
    label,
    onValueChanged,
    onBlur,
    props,
  } = useControl<boolean, CheckboxProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => !isReadonly && onValueChanged(e.target.checked),
    [onValueChanged, isReadonly],
  );

  const checkboxPosition = props.checkboxPosition;

  return (
    <div className={`gui-checkbox ${checkboxPosition === 'left' ? 'gui-checkbox--left' : ''}`}>
      <label htmlFor={uid}>{label + (validator?.required ? ' *' : '')}</label>

      <div className="gui-field gui-field--horizontal">
        <input
          type="checkbox"
          id={uid}
          checked={value ?? false}
          disabled={isDisabled}
          aria-checked={value ?? false}
          aria-readonly={isReadonly}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>
      <Errors errors={errors} />
    </div>
  );
}
