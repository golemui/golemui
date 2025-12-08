import * as Core from '@golemui/core';
import { cn, useControlField } from '@golemui/react';
import {
  createOptionMapper,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  Option,
  OptionValue,
  SelectProps,
} from '@golemui/shared-vanilla';
import { useCallback, useEffect, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

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
  } = useControlField<OptionValue, SelectProps>(field);

  const hint = props.hint;
  const placeholder = props.placeholder;
  const icon = props.icon;
  const iconPosition = props.iconPosition;

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [hasMatchingValue, setHasMatchingValue] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [safeValue, setSafeValue] = useState<OptionValue | undefined>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChanged(inferOptionValue(e.target.value, options));
    },
    [onValueChanged, options],
  );

  useEffect(() => {
    let opts = props.options;
    if (Array.isArray(opts) && opts.length > 0) {
      if (isOption(opts[0])) {
        // Nothing to do here, It's an option already
      } else if (isOptionValue(opts[0])) {
        // It's a flat array: string[] | number[]
        opts = (opts as unknown as OptionValue[]).map((opt) => ({
          label: opt.toString(),
          value: opt,
        }));
      } else if (isProtoOption(opts[0], props as SelectProps)) {
        const optionMapper: (item: unknown) => Option = createOptionMapper(opts[0], props);
        opts = opts.map(optionMapper);
      } else {
        throw new Error('Invalid option shape');
      }
      setOptions(opts);
      // If value is not one of your real options, map it back to "" so that the placeholder becomes selected.
      const matching = opts.find((opt) => opt.value === value) !== undefined;
      setHasMatchingValue(matching);
      setSafeValue(matching ? value : '');
    }
  }, [props, value]);

  const showErrors = isTouched && errors && errors.length > 0;

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
          className={cn({
            'gui-select--icon': !!icon,
            'gui-select--icon-right': iconPosition === 'right',
          })}
          required={validator?.required}
          value={safeValue ?? ''}
          disabled={isDisabled || isReadonly}
          aria-invalid={showErrors}
          aria-readonly={isDisabled || isReadonly}
          aria-errormessage={showErrors ? `${uid}_errors` : undefined}
          aria-required={validator?.required}
          aria-describedby={hint ? `${uid}_hint` : undefined}
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
            className={cn(icon, 'gui-field-icon', {
              'gui-field-icon--right': iconPosition === 'right',
            })}
          ></span>
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
