import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { CalendarProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function Calendar(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged } = useControlField<
    string,
    CalendarProps
  >(field);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => onValueChanged(e.detail.value);
      if (node) {
        target.addEventListener('change', changeHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
      };
    },
    [onValueChanged],
  );

  const hint = templateData.hint;
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
    <div className="gui-calendar">
      <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
        {templateData.label + (isRequired ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <gui-calendar-control
          ref={handleRef}
          uid={uid}
          hint={hint}
          touched={isTouched}
          errors={errors}
          hasError={showErrors}
          disabled={isDisabled}
          readonly={isReadonly}
          value={value}
          prevMonthIcon={prevMonthIcon}
          nextMonthIcon={nextMonthIcon}
          dayFormat={dayFormat}
          weekdayFormat={weekdayFormat}
          monthFormat={monthFormat}
        />
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
