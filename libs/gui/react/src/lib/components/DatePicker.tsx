import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DatePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';
import { GuiDatePickerReact } from '../web-components';

export function DatePicker(widgetInstance: WithWidget) {
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
  } = useInputWidget<string, DatePickerProps>(widget);

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
    <div className="gui-date-picker gui-field" style={{ flex: templateData.size }}>
      <GuiDatePickerReact
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
        prevMonthIcon={templateData.prevMonthIcon}
        nextMonthIcon={templateData.nextMonthIcon}
        prevMonthAriaLabel={templateData.prevMonthAriaLabel}
        nextMonthAriaLabel={templateData.nextMonthAriaLabel}
        selectYearAriaLabel={templateData.selectYearAriaLabel}
        yearGridAriaLabel={templateData.yearGridAriaLabel}
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
