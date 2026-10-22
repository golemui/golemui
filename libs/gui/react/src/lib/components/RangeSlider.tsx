import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import type { GuiRangeSlider } from '@golemui/gui-components/range-slider';
import type { RangeSliderProps, SliderRange } from '@golemui/gui-shared/internals';
import { useCallback } from 'react';
import { GuiRangeSliderReact } from '../web-components';
import '../styles.scss';

export function RangeSlider(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<SliderRange>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    SliderRange,
    RangeSliderProps
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
    <div className="gui-range-slider gui-field">
      <GuiRangeSliderReact
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
        marks={templateData.marks as GuiRangeSlider['marks']}
        format={templateData.format}
        valuePlacement={templateData.valuePlacement}
        startLabel={templateData.startLabel as string}
        endLabel={templateData.endLabel as string}
        localeId={templateData.lang}
        onGuiInput={handleChange}
        onGuiBlur={onBlur}
      ></GuiRangeSliderReact>
    </div>
  );
}
