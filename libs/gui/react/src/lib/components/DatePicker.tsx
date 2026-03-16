import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { DatePickerProps } from '@golemui/gui-shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function DatePicker(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<string>;
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

      dateControlRef.current = node;

      if (node) {
        target.addEventListener('change', changeHandler);
        target.addEventListener('focus', focusHandler);
        target.addEventListener('blur', onBlur);
        target.addEventListener('inputError', errorHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('focus', focusHandler);
        target.removeEventListener('blur', onBlur);
        target.removeEventListener('inputError', errorHandler);
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
    const isInputClick = target.closest('.gui-date-input__part');
    const isCalendarClick = target.closest('gui-calendar');
    if (isInputClick || isCalendarClick) {
      if (!isCalendarOpen) setIsCalendarOpen(true);
    } else {
      setIsCalendarOpen((prev) => !prev);
    }
  };

  const hint = templateData.hint;
  const icon = templateData.icon;
  const prevMonthIcon = templateData.prevMonthIcon;
  const nextMonthIcon = templateData.nextMonthIcon;
  const prevMonthAriaLabel = templateData.prevMonthAriaLabel;
  const nextMonthAriaLabel = templateData.nextMonthAriaLabel;
  const dayFormat = templateData.dayFormat;
  const weekdayFormat = templateData.weekdayFormat;
  const monthFormat = templateData.monthFormat;
  const showErrors = isTouched && errors && errors.length > 0;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const lang = templateData.lang;

  return (
    <div
      ref={containerRef}
      className="gui-date-picker"
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
        <gui-date
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
        />
        <span className="gui-date-picker__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </span>

        {isCalendarOpen && (
          <gui-calendar
            ref={handleCalendarRef}
            uid={uid}
            hint={hint}
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
            localeId={lang}
          />
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
