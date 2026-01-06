import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function Checkbox(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useControlField<
    boolean,
    CheckboxProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      !templateData.readonly && onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged, templateData.readonly],
  );

  const hint = templateData.hint;
  const checkboxPosition = templateData.checkboxPosition;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className={`gui-checkbox ${checkboxPosition === 'left' ? 'gui-checkbox--left' : ''}`}>
      <label className="gui-label" htmlFor={uid}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
        {showErrors && <Errors errors={errors} uid={uid} />}
      </label>

      <div className="gui-field gui-field--horizontal">
        <gui-checkbox-control
          uid={uid}
          hint={hint}
          touched={isTouched}
          errors={errors}
          disabled={isDisabled}
          readOnly={isReadonly}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
