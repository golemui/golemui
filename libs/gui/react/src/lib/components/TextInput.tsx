import type { InputWidget, Validator, WithWidget } from '@golemui/core'
import { useInputWidget } from '@golemui/react';
import { type TextinputProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function TextInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    TextinputProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const autocomplete = templateData.autocomplete;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-textinput gui-field" style={{ flex: templateData.size }}>
      <gui-textinput
        uid={uid}
        label={label}
        hint={hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        icon={icon}
        placeholder={placeholder ?? undefined}
        autocomplete={autocomplete ?? undefined}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-textinput>
    </div>
  );
}
