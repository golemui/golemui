import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { TextinputProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function TextInput(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    string,
    TextinputProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const iconPosition = templateData.iconPosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-textinput" style={{ flex: templateData.size }}>
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
        iconPosition={iconPosition}
        placeholder={placeholder ?? undefined}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-textinput>
    </div>
  );
}
