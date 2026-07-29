import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateRange, RangeDatePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';
import { GuiRangeDatePickerReact } from '../web-components';

export function RangeDatePicker(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<DateRange[]>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<DateRange[], RangeDatePickerProps>(widget);

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
      onBlur();
    },
    [injectValidationIssues, onBlur],
  );

  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-date-picker gui-field" style={{ flex: templateData.size }}>
      <GuiRangeDatePickerReact
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
        separator={templateData.separator}
        removePillAriaLabel={templateData.removePillAriaLabel}
        startDateAriaLabel={templateData.startDateAriaLabel}
        endDateAriaLabel={templateData.endDateAriaLabel}
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
        invalidDateMessage={templateData.invalidDateMessage as string}
        minDateMessage={templateData.minDateMessage as string}
        maxDateMessage={templateData.maxDateMessage as string}
        disabledDateRangeMessage={templateData.disabledDateRangeMessage as string}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      />
    </div>
  );
}
