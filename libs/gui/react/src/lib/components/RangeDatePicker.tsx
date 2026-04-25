import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { DateRange, RangeDatePickerProps } from '@golemui/gui-shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function RangeDatePicker(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<DateRange[]>;
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [focusDate, setFocusDate] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dateControlRef = useRef<HTMLElement | null>(null);
  const calendarControlRef = useRef<HTMLElement | null>(null);

  const handleDateRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };
      const errorHandler = (e: CustomEvent) => {
        injectValidationIssues([e.detail.message]);
      };
      const focusHandler = () => {
        setIsCalendarOpen(true);
      };
      const pillClickHandler = (e: CustomEvent) => {
        setFocusDate(e.detail.range.start);
        setIsCalendarOpen(true);
      };

      dateControlRef.current = node;

      if (node) {
        target.addEventListener('change', changeHandler);
        target.addEventListener('focus', focusHandler);
        target.addEventListener('blur', onBlur);
        target.addEventListener('inputError', errorHandler);
        target.addEventListener('pillClick', pillClickHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('focus', focusHandler);
        target.removeEventListener('blur', onBlur);
        target.removeEventListener('inputError', errorHandler);
        target.removeEventListener('pillClick', pillClickHandler);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues],
  );

  const handleCalendarRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };
      const blurHandler = (e: CustomEvent) => {
        onBlur();
        setIsCalendarOpen(false);
      };

      calendarControlRef.current = node;

      if (node) {
        target.addEventListener('blur', blurHandler);
        target.addEventListener('change', changeHandler);
      }

      return () => {
        target.addEventListener('blur', blurHandler);
        target.addEventListener('change', changeHandler);
      };
    },
    [onValueChanged, injectValidationIssues, onBlur],
  );

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!isCalendarOpen) return;
      const path = event.composedPath();
      const clickedInsideDate = dateControlRef.current && path.includes(dateControlRef.current);
      const clickedInsideCalendar =
        calendarControlRef.current && path.includes(calendarControlRef.current);

      if (!clickedInsideDate && !clickedInsideCalendar) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('click', onDocumentClick);

    return () => {
      document.removeEventListener('click', onDocumentClick);
    };
  }, [isCalendarOpen]);

  const onFocusOut = (event: React.FocusEvent) => {
    if (!isCalendarOpen) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && containerRef.current?.contains(newFocusTarget)) {
      return;
    }

    setIsCalendarOpen(false);
  };

  const toggleCalendar = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const isInputClick = target.closest('.gui-range-date-input__part');
    const isCalendarClick = target.closest('gui-range-calendar');
    const isPillClick = target.closest('.gui-range-date-input__pill');
    const isPillCountClick = target.closest('.gui-range-date-input__pill--count');
    if (isInputClick || isCalendarClick || isPillClick) {
      if (!isCalendarOpen) setIsCalendarOpen(true);
    } else if (isPillCountClick) {
      if (isCalendarOpen) setIsCalendarOpen(false);
    } else {
      setIsCalendarOpen((prev) => !prev);
    }
  };

  const hint = templateData.hint;
  const icon = templateData.icon;
  const separator = templateData.separator;
  const removePillAriaLabel = templateData.removePillAriaLabel;
  const startDateAriaLabel = templateData.startDateAriaLabel;
  const endDateAriaLabel = templateData.endDateAriaLabel;
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
  const showErrors = isTouched && errors && errors.length > 0;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const lang = templateData.lang;

  return (
    <div
      ref={containerRef}
      className="gui-range-date-picker gui-field"
      style={{ flex: templateData.size }}
      onBlur={onFocusOut}
    >
      {templateData.label && (
        <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
          {templateData.label + (isRequired ? ' *' : '')}
          {hint && (
            <div className="gui-widget-hint" id={`${uid}_hint`}>
              {hint}
            </div>
          )}
        </label>
      )}
      <div
        role="button"
        tabIndex={-1}
        className="gui-widget"
        onClick={toggleCalendar}
        onKeyUp={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            setIsCalendarOpen((prev) => !prev);
          }
        }}
        aria-expanded={isCalendarOpen}
      >
        <gui-range-date
          ref={handleDateRef}
          uid={uid}
          hint={hint}
          showErrors={false}
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
          startDateAriaLabel={startDateAriaLabel}
          endDateAriaLabel={endDateAriaLabel}
        />
        <span className="gui-range-date-picker__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </span>

        {isCalendarOpen && (
          <gui-range-calendar
            ref={handleCalendarRef}
            uid={uid}
            hint={hint}
            touched={isTouched}
            required={isRequired}
            disabled={isDisabled}
            readOnly={isReadonly}
            value={value}
            focusDate={focusDate}
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
            hidePills={true}
          />
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
