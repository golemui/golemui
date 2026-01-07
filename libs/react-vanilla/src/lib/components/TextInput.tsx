import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { TextinputProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function TextInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    string,
    TextinputProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const iconPosition = templateData.iconPosition;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-textinput">
      <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <gui-textinput
          uid={uid}
          hint={hint}
          touched={isTouched}
          errors={errors}
          disabled={isDisabled}
          readOnly={isReadonly}
          value={value}
          icon={icon}
          iconPosition={iconPosition}
          placeholder={placeholder ?? undefined}
          onInput={handleChange}
          onBlur={onBlur}
        ></gui-textinput>
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
