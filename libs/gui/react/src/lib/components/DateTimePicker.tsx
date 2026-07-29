import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateTimePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';
import { GuiDateTimePickerReact } from '../web-components';

export function DateTimePicker(widgetInstance: WithWidget) {
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
  } = useInputWidget<string, DateTimePickerProps>(widget);

  const handleChange = useCallback(
    (e: Event) => {
      injectValidationIssues(null);
      onValueChanged((e as CustomEvent).detail.value);
    },
    [injectValidationIssues, onValueChanged],
  );

  const handleInputError = useCallback(
    (e: Event) => {
      injectValidationIssues([(e as CustomEvent).detail.message]);
    },
    [injectValidationIssues],
  );

  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-date-time-picker gui-field" style={{ flex: templateData.size }}>
      <GuiDateTimePickerReact
        uid={uid}
        label={templateData.label as string}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={templateData.disabled as boolean}
        readOnly={templateData.readonly as boolean}
        value={value}
        icon={templateData.icon}
        localeId={templateData.lang}
        toggleAriaLabel={templateData.toggleAriaLabel}
        dayAriaLabel={templateData.dayAriaLabel}
        monthAriaLabel={templateData.monthAriaLabel}
        yearAriaLabel={templateData.yearAriaLabel}
        hourAriaLabel={templateData.hourAriaLabel}
        minuteAriaLabel={templateData.minuteAriaLabel}
        dayPeriodAriaLabel={templateData.dayPeriodAriaLabel}
        prevMonthIcon={templateData.prevMonthIcon}
        nextMonthIcon={templateData.nextMonthIcon}
        prevMonthAriaLabel={templateData.prevMonthAriaLabel}
        nextMonthAriaLabel={templateData.nextMonthAriaLabel}
        dayFormat={templateData.dayFormat}
        weekdayFormat={templateData.weekdayFormat}
        monthFormat={templateData.monthFormat}
        minDate={templateData.minDate}
        maxDate={templateData.maxDate}
        disabledRanges={templateData.disabledRanges}
        numberOfMonths={templateData.numberOfMonths}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        minTime={templateData.minTime}
        maxTime={templateData.maxTime}
        disabledTimeRanges={templateData.disabledTimeRanges}
        allowCustomTime={templateData.allowCustomTime}
        invalidDateMessage={templateData.invalidDateMessage as string}
        minDateMessage={templateData.minDateMessage as string}
        maxDateMessage={templateData.maxDateMessage as string}
        disabledDateRangeMessage={templateData.disabledDateRangeMessage as string}
        minTimeMessage={templateData.minTimeMessage as string}
        maxTimeMessage={templateData.maxTimeMessage as string}
        disabledTimeRangeMessage={templateData.disabledTimeRangeMessage as string}
        noAvailableTimesMessage={templateData.noAvailableTimesMessage as string}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      />
    </div>
  );
}
