import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { TimeRange, RangeTimeInputProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeTimeReact } from '../web-components';
import '../styles.scss';

export function RangeTimeInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<TimeRange[]>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onBlur,
    onValueChanged,
    injectValidationIssues,
  } = useInputWidget<TimeRange[], RangeTimeInputProps>(widget);

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
  const icon = templateData.icon;
  const lang = templateData.lang;
  const separator = templateData.separator;
  const removePillAriaLabel = templateData.removePillAriaLabel;
  const startTimeAriaLabel = templateData.startTimeAriaLabel;
  const endTimeAriaLabel = templateData.endTimeAriaLabel;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-time-input gui-field" style={{ flex: templateData.size }}>
      <GuiRangeTimeReact
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
        icon={icon}
        localeId={lang}
        separator={separator}
        removePillAriaLabel={removePillAriaLabel}
        startTimeAriaLabel={startTimeAriaLabel}
        endTimeAriaLabel={endTimeAriaLabel}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        minTime={templateData.minTime}
        maxTime={templateData.maxTime}
        minTimeMessage={templateData.minTimeMessage as string}
        maxTimeMessage={templateData.maxTimeMessage as string}
        rangeOrderMessage={templateData.rangeOrderMessage as string}
      />
    </div>
  );
}
