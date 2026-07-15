import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { TimeRange, RangeTimePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';
import { GuiRangeTimePickerReact } from '../web-components';

export function RangeTimePicker(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<TimeRange[]>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<TimeRange[], RangeTimePickerProps>(widget);

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
    <div className="gui-range-time-picker gui-field" style={{ flex: templateData.size }}>
      <GuiRangeTimePickerReact
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
        separator={templateData.separator}
        removePillAriaLabel={templateData.removePillAriaLabel}
        startTimeAriaLabel={templateData.startTimeAriaLabel}
        endTimeAriaLabel={templateData.endTimeAriaLabel}
        startTimeLabel={templateData.startTimeLabel as string}
        endTimeLabel={templateData.endTimeLabel as string}
        hourFormat={templateData.hourFormat}
        minuteStep={templateData.minuteStep}
        minTime={templateData.minTime}
        maxTime={templateData.maxTime}
        disabledRanges={templateData.disabledRanges}
        allowCustomTime={templateData.allowCustomTime}
        height={templateData.height}
        itemHeight={templateData.itemHeight}
        minTimeMessage={templateData.minTimeMessage as string}
        maxTimeMessage={templateData.maxTimeMessage as string}
        rangeOrderMessage={templateData.rangeOrderMessage as string}
        disabledRangeMessage={templateData.disabledRangeMessage as string}
        noAvailableTimesMessage={templateData.noAvailableTimesMessage as string}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      />
    </div>
  );
}
