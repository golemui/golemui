import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import { CurrencyProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Currency(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.InputWidget<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    number,
    CurrencyProps
  >(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const currency = templateData.currency;
  const maximumFractionDigits = templateData.maximumFractionDigits;
  const minimumFractionDigits = templateData.minimumFractionDigits;
  const icon = templateData.icon;
  const iconPosition = templateData.iconPosition;
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
        maximumFractionDigits={maximumFractionDigits}
        minimumFractionDigits={minimumFractionDigits}
        icon={icon}
        iconPosition={iconPosition}
        placeholder={placeholder ?? undefined}
        localeId={lang}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-currency>
    </div>
  );
}
