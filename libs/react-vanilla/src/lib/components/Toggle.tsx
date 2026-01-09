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

  const label = templateData.label;
  const hint = templateData.hint;
  const togglePosition = templateData.togglePosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  return (
    <div className={`gui-toggle`}>
      <gui-toggle
        uid={uid}
        label={label}
        touched={isTouched}
        errors={errors}
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
