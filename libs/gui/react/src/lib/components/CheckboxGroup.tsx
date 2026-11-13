import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { CheckboxGroupProps, OptionValue } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiCheckboxGroupReact } from '../web-components';
import '../styles.scss';

export function CheckboxGroup(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<OptionValue[]>;
  const { uid, formName, errors, value, isTouched, templateData, onValueChanged, onBlur } =
    useInputWidget<OptionValue[], CheckboxGroupProps>(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const options = templateData.options;
  const labelField = templateData.labelField;
  const valueField = templateData.valueField;
  const direction = templateData.direction;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-checkbox-group gui-field">
      <GuiCheckboxGroupReact
        uid={uid}
        idPrefix={formName}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        values={value}
        hint={hint}
        options={options}
        labelField={labelField}
        valueField={valueField}
        direction={direction}
        onGuiInput={handleChange}
        onGuiBlur={onBlur}
      ></GuiCheckboxGroupReact>
    </div>
  );
}
