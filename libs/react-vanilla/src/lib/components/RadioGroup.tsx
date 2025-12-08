import * as Core from '@golemui/core';
import { useControlField } from '@golemui/react';
import {
  createOptionMapper,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  Option,
  OptionValue,
  RadiogroupProps,
  SelectProps,
} from '@golemui/shared-vanilla';
import { useCallback, useEffect, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';

export function RadioGroup(fieldInstance: Core.WithField) {
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
  } = useControlField<OptionValue, RadiogroupProps>(field);

  const hint = props.hint;

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [hasMatchingValue, setHasMatchingValue] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const matching = opts.find((opt) => opt.value === value) !== undefined;
      setHasMatchingValue(matching);
    }
  }, [props, value]);

  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-radiogroup">
      <label htmlFor={uid} className="gui-label">
        {label + (validator?.required ? ' *' : '')}
        {hint && (
          <div className="gui-field-hint" id={`${uid}_hint`}>
            {hint}
          </div>
        )}
      </label>
      <div className="gui-field">
        {optionsLoading ? (
          <span>Loading...</span>
        ) : (
          (options || []).map((opt, index) => (
            <label htmlFor={`${uid}_${index}`} key={`k-${opt.value}`}>
              <input
                type="radio"
                id={`${uid}_${index}`}
                name={uid}
                required={validator?.required}
                value={opt.value}
                checked={hasMatchingValue && opt.value === value}
                disabled={isDisabled || isReadonly}
                onChange={handleChange}
                onBlur={onBlur}
              />
              {opt.label}
            </label>
          ))
        )}
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
