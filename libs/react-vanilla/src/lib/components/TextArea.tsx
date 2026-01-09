import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { TextareaProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function TextArea(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    string,
    TextareaProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );
  const label = templateData.label;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const maxLength = (templateData.validator as Core.Validator)?.maxLength;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const counterMode = templateData.counterMode;
  const autoGrow = templateData.autoGrow;
  const minimumHeight = templateData.minimumHeight;

  return (
    <div className="gui-textarea">
      <gui-textarea
        uid={uid}
        label={label}
        touched={isTouched}
        errors={errors}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        placeholder={placeholder}
        icon={icon}
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
