import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { OptionValue, RadiogroupProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function RadioGroup(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    OptionValue,
    RadiogroupProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const options = templateData.options;
  const labelField = templateData.labelField;
  const valueField = templateData.valueField;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-radiogroup" style={{ flex: templateData.size }}>
      <gui-radiogroup
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
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
