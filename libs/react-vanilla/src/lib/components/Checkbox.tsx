import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Checkbox(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useControlField<
    boolean,
    CheckboxProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label;
  const hint = templateData.hint;
  const checkboxPosition = templateData.checkboxPosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className={`gui-checkbox`}>
      <gui-checkbox
        uid={uid}
        label={label}
        touched={isTouched}
        errors={errors}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        checkboxPosition={checkboxPosition}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </div>
  );
}
