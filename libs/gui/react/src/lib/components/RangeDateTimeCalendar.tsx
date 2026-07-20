import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateTimeRange, RangeDateTimeCalendarProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeDateTimeCalendarReact } from '../web-components';
import '../styles.scss';

export function RangeDateTimeCalendar(widgetInstance: WithWidget) {
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
  } = useInputWidget<DateTimeRange[], RangeDateTimeCalendarProps>(widget);

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
      // Surface the error immediately on a completed selection.
      onBlur();
    },
    [injectValidationIssues, onBlur],
  );

  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-date-time-calendar gui-field" style={{ flex: templateData.size }}>
      <GuiRangeDateTimeCalendarReact
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
        numberOfMonths={templateData.numberOfMonths}
        removePillAriaLabel={templateData.removePillAriaLabel}
        localeId={templateData.lang}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        allowCustomTime={templateData.allowCustomTime}
        startTimeLabel={templateData.startTimeLabel as string}
        endTimeLabel={templateData.endTimeLabel as string}
        minDateTime={templateData.minDateTime}
        maxDateTime={templateData.maxDateTime}
        disabledRanges={templateData.disabledRanges}
        minDateTimeMessage={templateData.minDateTimeMessage as string}
        maxDateTimeMessage={templateData.maxDateTimeMessage as string}
        disabledRangeMessage={templateData.disabledRangeMessage as string}
        noAvailableTimesMessage={templateData.noAvailableTimesMessage as string}
        dayCountAriaLabel={templateData.dayCountAriaLabel as string}
        disabledDayCountAriaLabel={templateData.disabledDayCountAriaLabel as string}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      />
    </div>
  );
}
