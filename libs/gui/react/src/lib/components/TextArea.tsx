import type * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type TextareaProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function TextArea(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    TextareaProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const maxLength = (templateData.validator as Core.Validator)?.maxLength;
  const counterMode = templateData.counterMode;
  const autocomplete = templateData.autocomplete;
  const autoGrow = templateData.autoGrow;
  const minimumHeight = templateData.minimumHeight;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-textarea gui-field" style={{ flex: templateData.size }}>
      <gui-textarea
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
      ></gui-textarea>
    </div>
  );
}
