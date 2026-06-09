import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeDateReact } from '../web-components';
import '../styles.scss';

export function RangeDateInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<DateRange[]>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onBlur,
    onValueChanged,
    injectValidationIssues,
  } = useInputWidget<DateRange[], RangeDateInputProps>(widget);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };
      const blurHandler = () => {
        onBlur();
      };
      const errorHandler = (e: CustomEvent) => {
        injectValidationIssues([e.detail.message]);
      };

      if (node) {
        target.addEventListener('blur', blurHandler);
        target.addEventListener('change', changeHandler);
        target.addEventListener('inputError', errorHandler);
      }

      return () => {
        target.removeEventListener('blur', blurHandler);
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('inputError', errorHandler);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const icon = templateData.icon;
  const lang = templateData.lang;
  const separator = templateData.separator;
  const removePillAriaLabel = templateData.removePillAriaLabel;
  const startDateAriaLabel = templateData.startDateAriaLabel;
  const endDateAriaLabel = templateData.endDateAriaLabel;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-date-input gui-field" style={{ flex: templateData.size }}>
      <GuiRangeDateReact
        ref={handleRef}
        uid={uid}
        label={label}
        hint={hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        icon={icon}
        localeId={lang}
        separator={separator}
        removePillAriaLabel={removePillAriaLabel}
        startDateAriaLabel={startDateAriaLabel}
        endDateAriaLabel={endDateAriaLabel}
      />
    </div>
  );
}
