import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { TimePickerProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import '../styles.scss';
import { GuiTimePickerReact } from '../web-components';

export function TimePicker(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<string, TimePickerProps>(widget);

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
    <div className="gui-time-picker gui-field" style={{ flex: templateData.size }}>
      <GuiTimePickerReact
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
        toggleAriaLabel={templateData.toggleAriaLabel}
        hourAriaLabel={templateData.hourAriaLabel}
        minuteAriaLabel={templateData.minuteAriaLabel}
        dayPeriodAriaLabel={templateData.dayPeriodAriaLabel}
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
        disabledRangeMessage={templateData.disabledRangeMessage as string}
        noAvailableTimesMessage={templateData.noAvailableTimesMessage as string}
        incompleteMessage={templateData.incompleteMessage as string}
        onChange={handleChange}
        onBlur={onBlur}
        onInputError={handleInputError}
      />
    </div>
  );
}
