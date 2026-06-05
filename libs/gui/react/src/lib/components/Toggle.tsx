import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type ToggleProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import { GuiToggleReact } from '../web-components';
import '../styles.scss';

export function Toggle(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useInputWidget<
    boolean,
    ToggleProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const togglePosition = templateData.togglePosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className={`gui-toggle gui-field`} style={{ flex: templateData.size }}>
      <GuiToggleReact
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
