import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeDateTimeReact } from '../web-components';
import '../styles.scss';

export function RangeDateTimeInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<DateTimeRange[]>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onBlur,
    onValueChanged,
    injectValidationIssues,
  } = useInputWidget<DateTimeRange[], RangeDateTimeInputProps>(widget);

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
  const startDateTimeAriaLabel = templateData.startDateTimeAriaLabel;
  const endDateTimeAriaLabel = templateData.endDateTimeAriaLabel;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-date-time-input gui-field" style={{ flex: templateData.size }}>
      <GuiRangeDateTimeReact
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
        startDateTimeAriaLabel={startDateTimeAriaLabel}
        endDateTimeAriaLabel={endDateTimeAriaLabel}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        minDate={templateData.minDate}
        maxDate={templateData.maxDate}
        minTime={templateData.minTime}
        maxTime={templateData.maxTime}
        invalidDateMessage={templateData.invalidDateMessage as string}
        minDateMessage={templateData.minDateMessage as string}
        maxDateMessage={templateData.maxDateMessage as string}
        minTimeMessage={templateData.minTimeMessage as string}
        maxTimeMessage={templateData.maxTimeMessage as string}
      />
    </div>
  );
}
