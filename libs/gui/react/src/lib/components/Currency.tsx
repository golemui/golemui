import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type CurrencyProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import { GuiCurrencyReact } from '../web-components';
import '../styles.scss';

export function Currency(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    number,
    CurrencyProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const currency = templateData.currency;
  const step = templateData.step;
  const maximumFractionDigits = templateData.maximumFractionDigits;
  const minimumFractionDigits = templateData.minimumFractionDigits;
  const autocomplete = templateData.autocomplete;
  const icon = templateData.icon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;
  const lang = templateData.lang;

  return (
    <div className="gui-currency gui-field" style={{ flex: templateData.size }}>
      <GuiCurrencyReact
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
        autocomplete={autocomplete ?? undefined}
        placeholder={placeholder ?? undefined}
        localeId={lang}
        onInput={handleChange}
        onBlur={onBlur}
      ></GuiCurrencyReact>
    </div>
  );
}
