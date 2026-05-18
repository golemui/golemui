import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { ToggleProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '@golemui/gui-components/toggle';
import '../styles.scss';

export function Toggle(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useInputWidget<
    boolean,
    ToggleProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const togglePosition = templateData.togglePosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className={`gui-toggle gui-field`} style={{ flex: templateData.size }}>
      <gui-toggle
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        togglePosition={togglePosition}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </div>
  );
}
