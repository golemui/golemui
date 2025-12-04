import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function NumberInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<number>;
  const {
    uid,
    validator,
    errors,
    value,
    isDisabled,
    isReadonly,
    isTouched,
    label,
    props,
    onValueChanged,
    onBlur,
  } = useControlField<number, NumberinputProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onValueChanged(e.target.valueAsNumber),
    [onValueChanged],
  );

  const hint = props.hint;
  const placeholder = props.placeholder;
  const min = props.min;
  const max = props.max;
  const step = props.step;
  const icon = props.icon;
  const iconPosition = props.iconPosition;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-number">
      <label htmlFor={uid}>
        {label + (validator?.required ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <input
          type="number"
          inputMode="numeric"
          id={uid}
          className={`${icon ? 'gui-number--icon' : ''} ${iconPosition === 'right' ? 'gui-number--icon-right' : ''}`}
          value={value ?? ''}
          disabled={isDisabled}
          readOnly={isReadonly}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder ?? undefined}
          onInput={handleChange}
          onBlur={onBlur}
          aria-invalid={showErrors}
          aria-errormessage={showErrors ? `${uid}_errors` : undefined}
          aria-required={validator?.required}
          aria-describedby={hint ? `${uid}_hint` : undefined}
        />
        {icon && (
          <span
            className={`${icon} gui-field-icon ${iconPosition === 'right' ? 'gui-field-icon--right' : ''}`}
          ></span>
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
