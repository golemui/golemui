import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { ToggleProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function Toggle(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useControlField<
    boolean,
    ToggleProps
  >(field);

  const hint = templateData.hint;
  const togglePosition = templateData.togglePosition;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => !isReadonly && onValueChanged(e.target.checked),
    [onValueChanged, isReadonly],
  );

  return (
    <div className={`gui-toggle ${togglePosition === 'left' ? 'gui-toggle--left' : ''}`}>
      <label className="gui-label" htmlFor={uid}>
        {templateData.label + (isRequired ? ' *' : '')}
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
          required={isRequired}
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
