import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { CheckboxProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiCheckboxReact } from '../web-components';
import '../styles.scss';

export function Checkbox(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<boolean>;
  const { uid, errors, value, onValueChanged, onBlur, templateData, isTouched } = useInputWidget<
    boolean,
    CheckboxProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const checkboxPosition = templateData.checkboxPosition;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className={`gui-checkbox gui-field`} style={{ flex: templateData.size }}>
      <GuiCheckboxReact
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
