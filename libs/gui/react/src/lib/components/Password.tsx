import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { PasswordProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function Password(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    PasswordProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const showPasswordIcon = templateData.showPasswordIcon;
  const hidePasswordIcon = templateData.hidePasswordIcon;
  const showPasswordLabel = templateData.showPasswordLabel;
  const hidePasswordLabel = templateData.hidePasswordLabel;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-password gui-field" style={{ flex: templateData.size }}>
      <gui-password
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
        showPasswordIcon={showPasswordIcon}
        hidePasswordIcon={hidePasswordIcon}
        showPasswordLabel={showPasswordLabel}
        hidePasswordLabel={hidePasswordLabel}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-password>
    </div>
  );
}
