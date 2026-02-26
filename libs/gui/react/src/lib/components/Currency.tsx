import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { CurrencyProps } from '@golemui/gui-components';
import { useCallback } from 'react';
import '../styles.scss';

export function Currency(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    number,
    CurrencyProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const currency = templateData.currency;
  const step = templateData.step;
  const maximumFractionDigits = templateData.maximumFractionDigits;
  const minimumFractionDigits = templateData.minimumFractionDigits;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const lang = templateData.lang;

  return (
    <div className="gui-currency" style={{ flex: templateData.size }}>
      <gui-currency
        uid={uid}
        label={label}
        hint={hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        currency={currency}
        step={step}
        maximumFractionDigits={maximumFractionDigits}
        minimumFractionDigits={minimumFractionDigits}
        icon={icon}
        placeholder={placeholder ?? undefined}
        localeId={lang}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-currency>
    </div>
  );
}
