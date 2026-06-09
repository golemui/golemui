import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { PasswordProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiPasswordReact } from '../web-components';
import '../styles.scss';

export function Password(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    PasswordProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const autocomplete = templateData.autocomplete;
  const showPasswordIcon = templateData.showPasswordIcon;
  const hidePasswordIcon = templateData.hidePasswordIcon;
  const showPasswordLabel = templateData.showPasswordLabel;
  const hidePasswordLabel = templateData.hidePasswordLabel;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-password gui-field" style={{ flex: templateData.size }}>
      <GuiPasswordReact
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
        showPasswordIcon={showPasswordIcon}
        hidePasswordIcon={hidePasswordIcon}
        showPasswordLabel={showPasswordLabel}
        hidePasswordLabel={hidePasswordLabel}
        onInput={handleChange}
        onBlur={onBlur}
      ></GuiPasswordReact>
    </div>
  );
}
