import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { CheckboxProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function Checkbox(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useInputWidget<
    boolean,
    CheckboxProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const checkboxPosition = templateData.checkboxPosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className={`gui-checkbox gui-field`}>
      <gui-checkbox
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        checkboxPosition={checkboxPosition}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </div>
  );
}
