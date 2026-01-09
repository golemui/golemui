import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { DatePickerProps } from '@golemui/shared-vanilla';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function DatePicker(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useControlField<string, DatePickerProps>(field);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

      calendarControlRef.current = node;

      if (node) {
        target.addEventListener('change', changeHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
      };
    },
    [onValueChanged, injectValidationIssues],
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

  const openCalendar = () => {
    if (!isCalendarOpen) setIsCalendarOpen(true);
  };

  const hint = templateData.hint;
  const icon = templateData.icon;
  const prevMonthIcon = templateData.prevMonthIcon;
  const nextMonthIcon = templateData.nextMonthIcon;
  const dayFormat = templateData.dayFormat;
  const weekdayFormat = templateData.weekdayFormat;
  const monthFormat = templateData.monthFormat;
  const showErrors = isTouched && errors && errors.length > 0;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;

  return (
    <div className="gui-date-picker">
      <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div
        role="button"
        tabIndex={0}
        className="gui-field"
        onClick={openCalendar}
        onKeyUp={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            openCalendar();
          }
        }}
        aria-expanded={isCalendarOpen}
      >
        <gui-date
          ref={handleDateRef}
          uid={uid}
          hint={hint}
          touched={isTouched}
          errors={errors}
          disabled={isDisabled}
          readonly={isReadonly}
          value={value}
          icon={icon}
        />

        {isCalendarOpen && (
          <gui-calendar
            ref={handleCalendarRef}
            uid={uid}
            hint={hint}
            touched={isTouched}
            disabled={isDisabled}
            readonly={isReadonly}
            value={value}
            prevMonthIcon={prevMonthIcon}
            nextMonthIcon={nextMonthIcon}
            dayFormat={dayFormat}
            weekdayFormat={weekdayFormat}
            monthFormat={monthFormat}
          />
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
