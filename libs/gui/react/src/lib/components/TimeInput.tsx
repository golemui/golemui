import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { TimeInputProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiTimeReact } from '../web-components';
import '../styles.scss';

export function TimeInput(widgetInstance: WithWidget) {
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
  } = useInputWidget<string, TimeInputProps>(widget);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };

      if (node) {
        target.addEventListener('change', changeHandler);
        target.addEventListener('blur', onBlur);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('blur', onBlur);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;
  const lang = templateData.lang;
  const hourFormat = templateData.hourFormat;
  const minuteStep = templateData.minuteStep;

  return (
    <div className="gui-time gui-field" style={{ flex: templateData.size }}>
      <GuiTimeReact
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
        hourFormat={hourFormat}
        minuteStep={minuteStep}
      />
    </div>
  );
}
