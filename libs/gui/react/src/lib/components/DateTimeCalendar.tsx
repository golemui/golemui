import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateTimeCalendarProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiDateTimeCalendarReact } from '../web-components';
import '../styles.scss';

export function DateTimeCalendar(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onBlur,
    onValueChanged,
    injectValidationIssues,
  } = useInputWidget<string, DateTimeCalendarProps>(widget);

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
    <div className="gui-date-time-calendar gui-field" style={{ flex: templateData.size }}>
      <GuiDateTimeCalendarReact
        uid={uid}
        label={templateData.label as string}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={templateData.disabled as boolean}
        readOnly={templateData.readonly as boolean}
        value={value}
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
        localeId={templateData.lang}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        minTime={templateData.minTime}
        maxTime={templateData.maxTime}
        disabledTimeRanges={templateData.disabledTimeRanges}
        allowCustomTime={templateData.allowCustomTime}
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
