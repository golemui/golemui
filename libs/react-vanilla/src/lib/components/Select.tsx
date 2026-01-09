import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { OptionValue, SelectProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Select(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    OptionValue,
    SelectProps
  >(field);

  const options = templateData.options;
  const label = templateData.label;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const iconPosition = templateData.iconPosition;
  const valueField = templateData.valueField;
  const labelField = templateData.labelField;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-select">
      <gui-select
        uid={uid}
        label={label}
        touched={isTouched}
        errors={errors}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        placeholder={placeholder}
        icon={icon}
        iconPosition={iconPosition}
        options={options}
        labelField={labelField}
        valueField={valueField}
        onChange={handleChange}
        onBlur={onBlur}
      ></gui-select>
    </div>
  );
}
