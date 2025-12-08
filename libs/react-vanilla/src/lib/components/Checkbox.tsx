import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
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
    isTouched,
  } = useControlField<boolean, CheckboxProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => !isReadonly && onValueChanged(e.target.checked),
    [onValueChanged, isReadonly],
  );

  const hint = props.hint;
  const checkboxPosition = props.checkboxPosition;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className={`gui-checkbox ${checkboxPosition === 'left' ? 'gui-checkbox--left' : ''}`}>
      <label htmlFor={uid}>
        {label + (validator?.required ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
        {showErrors && <Errors errors={errors} uid={uid} />}
      </label>

      <div className="gui-field gui-field--horizontal">
        <input
          type="checkbox"
          id={uid}
          disabled={isDisabled}
          readOnly={isReadonly}
          aria-readonly={isReadonly}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
