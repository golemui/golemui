import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type OptionValue, type SelectProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import { GuiSelectReact } from '../web-components';
import '../styles.scss';

export function Select(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<OptionValue, SelectProps>(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const handleInputError = useCallback(
    (e: Event) => injectValidationIssues([(e as CustomEvent).detail.message]),
    [injectValidationIssues],
  );

  const options = templateData.options;
  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const autocomplete = templateData.autocomplete;
  const icon = templateData.icon;
  const valueField = templateData.valueField;
  const labelField = templateData.labelField;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-select gui-field" style={{ flex: templateData.size }}>
      <GuiSelectReact
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
        icon={icon}
        options={options}
        labelField={labelField}
        valueField={valueField}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      ></GuiSelectReact>
    </div>
  );
}
