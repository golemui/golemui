import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { useCallback } from 'react';

export function Customdate(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.InputWidget<string>;
  const { uid, errors, value, isTouched, onValueChanged, onBlur, injectValidationIssues } =
    useInputWidget<string, Record<string, any>>(field);

  const injectIssues = useCallback(
    (ddmmyyyy: string) => {
      if (ddmmyyyy.length === 0) {
        injectValidationIssues(null);
        return;
      }

      // expected value format: dd-mm-yyyy
      const regEx = /^(\d{2})-(\d{2})-(\d{4})$/;
      const results = regEx.exec(ddmmyyyy);

      if (!results) {
        injectValidationIssues(['Invalid date format']);
        return;
      }

      const day = Number(results[1]); // 01 -> 31
      const month = Number(results[2]); // 01 -> 12
      const year = Number(results[3]);

      // basic range checks
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        injectValidationIssues(['Impossible date']);
        return;
      }

      // calendar-validity check
      const date = new Date(year, month - 1, day);
      const isValid =
        date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

      if (!isValid) {
        injectValidationIssues(['Invalid date']);
        return;
      }

      injectValidationIssues(null);
    },
    [injectValidationIssues],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChanged(e.target.value);
      injectIssues(e.target.value ?? '');
    },
    [onValueChanged, injectIssues],
  );

  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-customdate">
      <div className="gui-field">
        <input
          type="text"
          id={uid}
          data-cy={`${uid}_customdate`}
          value={value ?? ''}
          placeholder="dd-mm-yyyy"
          onInput={handleChange}
          onBlur={onBlur}
        />
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}

function Errors({ errors, uid }: { errors: string[]; uid: string }) {
  return (
    <ul className="gui-validator" id={`${uid}_errors`} data-cy={`${uid}_validator-errors`}>
      {errors.map((error, index) => (
        <li className="gui-validator__error" key={index} data-cy={`${uid}_validator-error`}>
          {error}
        </li>
      ))}
    </ul>
  );
}
