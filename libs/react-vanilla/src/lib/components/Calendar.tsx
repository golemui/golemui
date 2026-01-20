import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { CalendarProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Calendar(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onBlur, onValueChanged } = useControlField<
    string,
    CalendarProps
  >(field);

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
  const dayFormat = templateData.dayFormat;
  const weekdayFormat = templateData.weekdayFormat;
  const monthFormat = templateData.monthFormat;
  const lang = templateData.lang;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-calendar">
      <gui-calendar
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
        dayFormat={dayFormat}
        weekdayFormat={weekdayFormat}
        monthFormat={monthFormat}
        localeId={lang}
      />
    </div>
  );
}
