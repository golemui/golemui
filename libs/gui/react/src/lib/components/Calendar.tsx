import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { CalendarProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiCalendarReact } from '../web-components';
import '../styles.scss';

export function Calendar(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onBlur, onValueChanged } = useInputWidget<
    string,
    CalendarProps
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
  const selectYearAriaLabel = templateData.selectYearAriaLabel;
  const yearGridAriaLabel = templateData.yearGridAriaLabel;
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
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-calendar gui-field" style={{ flex: templateData.size }}>
      <GuiCalendarReact
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
        selectYearAriaLabel={selectYearAriaLabel}
        yearGridAriaLabel={yearGridAriaLabel}
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
