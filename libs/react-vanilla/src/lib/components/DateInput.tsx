import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { DatePickerProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function DateInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useControlField<string, DatePickerProps>(field);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };
      const errorHandler = (e: CustomEvent) => {
        injectValidationIssues([e.detail.message]);
      };

      if (node) {
        target.addEventListener('change', changeHandler);
        target.addEventListener('blur', onBlur);
        target.addEventListener('inputError', errorHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('blur', onBlur);
        target.removeEventListener('inputError', errorHandler);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues],
  );

  const hint = templateData.hint;
  const icon = templateData.icon;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-date">
      <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <gui-date-control
          ref={handleRef}
          uid={uid}
          hint={hint}
          touched={isTouched}
          errors={errors}
          disabled={isDisabled}
          readonly={isReadonly}
          value={value}
          icon={icon}
        />
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
