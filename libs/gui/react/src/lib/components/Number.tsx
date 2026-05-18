import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type NumberinputProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function NumberInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    number,
    NumberinputProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const step = templateData.step;
  const minimum = templateData.minimum;
  const maximum = templateData.maximum;
  const autocomplete = templateData.autocomplete;
  const autoGrow = templateData.autoGrow;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-number gui-field" style={{ flex: templateData.size }}>
      <gui-number
        uid={uid}
        label={label}
        hint={hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        step={step}
        minimum={minimum}
        maximum={maximum}
        autoGrow={autoGrow}
        autocomplete={autocomplete ?? undefined}
        placeholder={placeholder ?? undefined}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-number>
    </div>
  );
}
