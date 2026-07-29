import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateTimeRange, RangeDateTimePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeDateTimePickerReact } from '../web-components';
import '../styles.scss';

export function RangeDateTimePicker(widgetInstance: WithWidget) {
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
  } = useInputWidget<DateTimeRange[], RangeDateTimePickerProps>(widget);

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
    <div className="gui-range-date-time-picker gui-field" style={{ flex: templateData.size }}>
      <GuiRangeDateTimePickerReact
        uid={uid}
        label={templateData.label as string}
        hint={templateData.hint}
        icon={templateData.icon}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={templateData.disabled as boolean}
        readOnly={templateData.readonly as boolean}
        value={value}
        separator={templateData.separator as string}
        removePillAriaLabel={templateData.removePillAriaLabel}
        startDateTimeAriaLabel={templateData.startDateTimeAriaLabel as string}
        endDateTimeAriaLabel={templateData.endDateTimeAriaLabel as string}
        invalidDateMessage={templateData.invalidDateMessage as string}
        prevMonthIcon={templateData.prevMonthIcon}
        nextMonthIcon={templateData.nextMonthIcon}
        prevMonthAriaLabel={templateData.prevMonthAriaLabel}
        nextMonthAriaLabel={templateData.nextMonthAriaLabel}
        dayFormat={templateData.dayFormat}
        weekdayFormat={templateData.weekdayFormat}
        monthFormat={templateData.monthFormat}
        numberOfMonths={templateData.numberOfMonths}
        localeId={templateData.lang}
        toggleAriaLabel={templateData.toggleAriaLabel}
        dayAriaLabel={templateData.dayAriaLabel}
        monthAriaLabel={templateData.monthAriaLabel}
        yearAriaLabel={templateData.yearAriaLabel}
        hourAriaLabel={templateData.hourAriaLabel}
        minuteAriaLabel={templateData.minuteAriaLabel}
        dayPeriodAriaLabel={templateData.dayPeriodAriaLabel}
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
