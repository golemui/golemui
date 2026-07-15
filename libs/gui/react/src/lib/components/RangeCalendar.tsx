import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { DateRange, RangeCalendarProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeCalendarReact } from '../web-components';
import '../styles.scss';

export function RangeCalendar(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<DateRange[]>;
  const { uid, errors, value, isTouched, templateData, onBlur, onValueChanged, injectValidationIssues } =
    useInputWidget<DateRange[], RangeCalendarProps>(widget);

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
        onBlur();
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
  const prevMonthIcon = templateData.prevMonthIcon;
  const nextMonthIcon = templateData.nextMonthIcon;
  const prevMonthAriaLabel = templateData.prevMonthAriaLabel;
  const nextMonthAriaLabel = templateData.nextMonthAriaLabel;
  const dayFormat = templateData.dayFormat;
  const weekdayFormat = templateData.weekdayFormat;
  const monthFormat = templateData.monthFormat;
  const minDate = templateData.minDate;
  const maxDate = templateData.maxDate;
  const disabledRanges = templateData.disabledRanges;
  const numberOfMonths = templateData.numberOfMonths;
  const removePillAriaLabel = templateData.removePillAriaLabel;
  const lang = templateData.lang;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-calendar gui-field" style={{ flex: templateData.size }}>
      <GuiRangeCalendarReact
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
        prevMonthIcon={prevMonthIcon}
        nextMonthIcon={nextMonthIcon}
        prevMonthAriaLabel={prevMonthAriaLabel}
        nextMonthAriaLabel={nextMonthAriaLabel}
        dayFormat={dayFormat}
        weekdayFormat={weekdayFormat}
        monthFormat={monthFormat}
        minDate={minDate}
        maxDate={maxDate}
        disabledRanges={disabledRanges}
        disabledDateRangeMessage={templateData.disabledDateRangeMessage as string}
        numberOfMonths={numberOfMonths}
        hidePills={false}
        removePillAriaLabel={removePillAriaLabel}
        localeId={lang}
      />
    </div>
  );
}
