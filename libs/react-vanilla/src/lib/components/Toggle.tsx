import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { ToggleProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Toggle(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useControlField<
    boolean,
    ToggleProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const togglePosition = templateData.togglePosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className={`gui-toggle`} style={{ flex: templateData.size }}>
      <gui-toggle
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        togglePosition={togglePosition}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </div>
  );
}
