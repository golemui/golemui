import type { InputWidget, Validator, WithWidget } from '@golemui/core'
import { useInputWidget } from '@golemui/react';
import { type OptionValue, type RadiogroupProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function RadioGroup(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    OptionValue,
    RadiogroupProps
  >(widget);

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
  const direction = templateData.direction;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-radiogroup gui-field" style={{ flex: templateData.size }}>
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
        direction={direction}
        onChange={handleChange}
        onBlur={onBlur}
      ></gui-radiogroup>
    </div>
  );
}
