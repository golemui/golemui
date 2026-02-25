import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { DateRange, RangeCalendarProps } from '@golemui/gui-components';
import { useCallback } from 'react';
import '../styles.scss';

export function RangeCalendar(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<DateRange[]>;
  const { uid, errors, value, isTouched, templateData, onBlur, onValueChanged } = useInputWidget<
    DateRange[],
    RangeCalendarProps
  >(widget);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => onValueChanged(e.detail.value);
      const blurHandler = (e: CustomEvent) => {
        onBlur();
      };
      if (node) {
        target.addEventListener('blur', blurHandler);
        target.addEventListener('change', changeHandler);
      }

      return () => {
        target.removeEventListener('blur', blurHandler);
        target.removeEventListener('change', changeHandler);
      };
    },
    [onValueChanged, onBlur],
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
  const lang = templateData.lang;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-range-calendar">
      <gui-range-calendar
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
        numberOfMonths={numberOfMonths}
        localeId={lang}
      />
    </div>
  );
}
