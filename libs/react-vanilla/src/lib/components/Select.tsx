import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import {
  createOptionMapper,
  isOption,
  isOptionValue,
  isProtoOption,
  Option,
  OptionValue,
  SelectProps,
} from '@golemui/shared-vanilla';
import { useCallback, useEffect, useState } from 'react';
import '../styles.scss';

export function Select(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string>;
  const {
    uid,
    validator,
    errors,
    value,
    isDisabled,
    isReadonly,
    isTouched,
    label,
    props,
    onValueChanged,
    onBlur,
  } = useControlField<string, SelectProps>(field);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onValueChanged(e.target.value),
    [onValueChanged],
  );

  const hint = props.hint;
  const placeholder = props.placeholder;
  const icon = props.icon;
  const iconPosition = props.iconPosition;

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [hasMatchingValue, setHasMatchingValue] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [safeValue, setSafeValue] = useState<string | undefined>();

  useEffect(() => {
    const opts = props.options;
    if (Array.isArray(opts) && opts.length > 0) {
      if (isOption(opts[0])) {
        setOptions(opts);
      } else if (isOptionValue(opts[0])) {
        // It's a flat array: string[] | number[]
        setOptions(
          (opts as unknown as OptionValue[]).map((opt) => ({
            label: opt.toString(),
            value: opt,
          })),
        );
      } else if (isProtoOption(opts[0], props as SelectProps)) {
        const optionMapper: (item: unknown) => Option = createOptionMapper(opts[0], props);
        setOptions(opts.map(optionMapper));
      } else {
        throw new Error('Invalid option shape');
      }
      // If value is not one of your real options, map it back to "" so that the placeholder becomes selected.
      const selection = value;
      const matching = opts.find(({ value }) => value === selection) !== undefined;
      setHasMatchingValue(matching);
      setSafeValue(matching ? selection : '');
    }
  }, [props, value]);

  return (
    <div className="gui-select">
      <label htmlFor={uid}>
        {label + (validator?.required ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        <select
          id={uid}
          className={`${icon ? 'gui-select--icon' : ''} ${iconPosition === 'right' ? 'gui-select--icon-right' : ''}`}
          value={safeValue ?? ''}
          disabled={isDisabled || isReadonly}
          aria-readonly={isDisabled || isReadonly}
          onChange={handleChange}
          onBlur={onBlur}
        >
          {optionsLoading ? (
            <option value="">Loading...</option>
          ) : (
            <>
              <option value="" disabled key="select-an-option">
                {placeholder ?? 'Select an option'}
              </option>

              {(options || []).map((opt) => (
                <option value={opt.value} key={`k-${opt.value}`}>
                  {opt.label}
                </option>
              ))}
            </>
          )}
        </select>

        {icon && (
          <span
            className={`${icon} gui-field-icon ${iconPosition === 'right' ? 'gui-field-icon--right' : ''}`}
          ></span>
        )}
      </div>
    </div>
  );
}
