import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { ToggleProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function Toggle(fieldInstance: Core.WithField) {
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
  } = useControlField<boolean, ToggleProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => !isReadonly && onValueChanged(e.target.checked),
    [onValueChanged, isReadonly],
  );

  const hint = props.hint;
  const togglePosition = props.togglePosition;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className={`gui-toggle ${togglePosition === 'left' ? 'gui-toggle--left' : ''}`}>
      <label className="gui-label" htmlFor={uid}>
        {label + (validator?.required ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
        {showErrors && <Errors errors={errors} uid={uid} />}
      </label>

      <div className="gui-field gui-field--horizontal gui-toggle--switch">
        <input
          type="checkbox"
          id={uid}
          data-cy={`${uid}_toggle`}
          checked={value ?? false}
          required={validator?.required}
          disabled={isDisabled}
          readOnly={isReadonly}
          aria-readonly={isReadonly}
          onChange={handleChange}
          onBlur={onBlur}
        />

        <span className="gui-toggle--slider" role="presentation"></span>
      </div>
    </div>
  );
}
