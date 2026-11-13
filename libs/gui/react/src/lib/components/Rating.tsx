import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import type { NumberValidator } from '@golemui/gui-validators';
import { useInputWidget } from '@golemui/react';
import type { RatingProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRatingReact } from '../web-components';
import '../styles.scss';

export function Rating(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<number>;
  const { uid, formName, errors, value, isTouched, templateData, onValueChanged, onBlur } =
    useInputWidget<number, RatingProps>(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  // The number of stars is the integer validator's maximum.
  const max = (templateData.validator as NumberValidator | undefined)?.maximum;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-rating gui-field">
      <GuiRatingReact
        uid={uid}
        idPrefix={formName}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        max={max}
        onGuiInput={handleChange}
        onGuiBlur={onBlur}
      ></GuiRatingReact>
    </div>
  );
}
