import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function NumberInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    number,
    NumberinputProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const step = templateData.step;
  const icon = templateData.icon;
  const iconPosition = templateData.iconPosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-number">
      <gui-number
        uid={uid}
        label={label}
        hint={hint}
        touched={isTouched}
        errors={errors}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        step={step}
        icon={icon}
        iconPosition={iconPosition}
        placeholder={placeholder ?? undefined}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-number>
    </div>
  );
}
