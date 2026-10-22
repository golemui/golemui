import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { GuiSlider } from '@golemui/gui-components/slider';
import type { SliderProps } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiSliderReact } from '../web-components';
import '../styles.scss';

export function Slider(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<number>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    number,
    SliderProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-slider gui-field">
      <GuiSliderReact
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        minimum={templateData.minimum}
        maximum={templateData.maximum}
        step={templateData.step}
        // Core has translated the marks' labels by now.
        marks={templateData.marks as GuiSlider['marks']}
        format={templateData.format}
        valuePlacement={templateData.valuePlacement}
        localeId={templateData.lang}
        onGuiInput={handleChange}
        onGuiBlur={onBlur}
      ></GuiSliderReact>
    </div>
  );
}
