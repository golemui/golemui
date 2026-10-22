import { gui } from '@golemui/gui-shared';

export const rangeSliderTab = gui.layouts.grid([
  gui.inputs.rangeSlider('rangeSliders.price', {
    label: 'Price per night',
    hint: 'In euros. Screen readers name the thumbs "From" and "To"',
    maximum: 500,
    step: 10,
    format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    startLabel: 'From',
    endLabel: 'To',
    defaultValue: { start: 100, end: 300 },
  }),
  gui.inputs.rangeSlider('rangeSliders.age', {
    label: 'Age range',
    hint: 'No range until you move a thumb. Required: an error shows once it is touched',
    minimum: 18,
    maximum: 99,
    validator: { required: true, messages: { required: 'Pick an age range' } },
  }),
  gui.inputs.rangeSlider('rangeSliders.hours', {
    label: 'Opening hours',
    hint: 'Labelled marks, and the values in the label and in bubbles',
    maximum: 24,
    marks: [
      { value: 0, label: '0:00' },
      { value: 6, label: '6:00' },
      { value: 12, label: '12:00' },
      { value: 18, label: '18:00' },
      { value: 24, label: '24:00' },
    ],
    valuePlacement: 'both',
    defaultValue: { start: 9, end: 18 },
  }),
  gui.inputs.rangeSlider('rangeSliders.disabled', {
    label: 'Disabled',
    disabled: true,
    defaultValue: { start: 20, end: 60 },
  }),
  // A range slider lines up with the fields beside it: its marks' labels go under the control.
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('rangeSliders.city', { label: 'City', hint: 'Where to stay' }),
    gui.inputs.rangeSlider('rangeSliders.budget', {
      label: 'Budget',
      maximum: 1000,
      step: 50,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      marks: [
        { value: 0, label: '€0' },
        { value: 1000, label: '€1,000' },
      ],
    }),
  ]),
]);
