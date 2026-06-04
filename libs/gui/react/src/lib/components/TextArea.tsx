import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type TextareaProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import { GuiTextareaReact } from '../web-components';
import '../styles.scss';


export function TextArea(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    TextareaProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const maxLength = (templateData.validator as Validator)?.maxLength;
  const counterMode = templateData.counterMode;
  const autocomplete = templateData.autocomplete;
  const autoGrow = templateData.autoGrow;
  const minimumHeight = templateData.minimumHeight;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-textarea gui-field" style={{ flex: templateData.size }}>
      <GuiTextareaReact
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        placeholder={placeholder}
        autocomplete={autocomplete ?? undefined}
        counterMode={counterMode}
        minimumHeight={minimumHeight}
        autoGrow={autoGrow}
        maxLength={maxLength}
        onInput={handleChange}
        onBlur={onBlur}
      ></GuiTextareaReact>
    </div>
  );
}
