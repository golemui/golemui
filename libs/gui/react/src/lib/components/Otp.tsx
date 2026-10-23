import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { OtpProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiOtpReact } from '../web-components';
import '../styles.scss';

export function Otp(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    OtpProps
  >(widget);

  const handleInput = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;
  // The code is as long as the validator's exactLength, which makes a partial code invalid.
  const length = (templateData.validator as Validator)?.exactLength;

  return (
    <div className="gui-otp gui-field">
      <GuiOtpReact
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        length={length}
        groups={templateData.groups}
        onGuiInput={handleInput}
        onGuiBlur={onBlur}
      ></GuiOtpReact>
    </div>
  );
}
