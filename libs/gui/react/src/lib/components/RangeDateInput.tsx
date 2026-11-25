import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { CompleteDateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeDateReact } from '../web-components';
import '../styles.scss';

export function RangeDateInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<CompleteDateRange>;
  const {
    uid,
    formName,
    errors,
    value,
    isTouched,
    templateData,
    onBlur,
    onValueChanged,
    injectValidationIssues,
  } = useInputWidget<CompleteDateRange, RangeDateInputProps>(widget);

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
        target.addEventListener('gui-blur', blurHandler);
        target.addEventListener('gui-input', changeHandler);
        target.addEventListener('gui-input-error', errorHandler);
      }

      return () => {
        target.removeEventListener('gui-blur', blurHandler);
        target.removeEventListener('gui-input', changeHandler);
        target.removeEventListener('gui-input-error', errorHandler);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const icon = templateData.icon;
  const lang = templateData.lang;
  const separator = templateData.separator;
  const startDateAriaLabel = templateData.startDateAriaLabel;
  const endDateAriaLabel = templateData.endDateAriaLabel;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-range-date-input gui-field">
      <GuiRangeDateReact
        ref={handleRef}
        uid={uid}
        idPrefix={formName}
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
        dayAriaLabel={templateData.dayAriaLabel}
        monthAriaLabel={templateData.monthAriaLabel}
        yearAriaLabel={templateData.yearAriaLabel}
        invalidDateMessage={templateData.invalidDateMessage as string}
        incompleteMessage={templateData.incompleteMessage as string}
        separator={separator}
        startDateAriaLabel={startDateAriaLabel}
        endDateAriaLabel={endDateAriaLabel}
      />
    </div>
  );
}
