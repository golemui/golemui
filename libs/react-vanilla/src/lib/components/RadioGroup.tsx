import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { OptionValue, RadiogroupProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function RadioGroup(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    OptionValue,
    RadiogroupProps
  >(field);

  const label = templateData.label;
  const hint = templateData.hint;
  const options = templateData.options;
  const labelField = templateData.labelField;
  const valueField = templateData.valueField;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged, options],
  );

  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-radiogroup">
      <gui-radiogroup
        uid={uid}
        label={label}
        touched={isTouched}
        errors={errors}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        options={options}
        labelField={labelField}
        valueField={valueField}
        onChange={handleChange}
        onBlur={onBlur}
      ></gui-radiogroup>
    </div>
  );
}
