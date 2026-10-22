import { gui } from '@golemui/gui-shared';

export const sliderTab = gui.layouts.grid([
  gui.inputs.slider('sliders.volume', {
    label: 'Volume',
    hint: 'No value until you move the thumb. Required: an error shows once it is touched',
    validator: { required: true, messages: { invalid: 'Pick a volume' } },
  }),
  gui.inputs.slider('sliders.brightness', {
    label: 'Brightness',
    hint: 'A tick at every step of 10, filled up to the value',
    step: 10,
    marks: true,
    defaultValue: 40,
  }),
  gui.inputs.slider('sliders.opacity', {
    label: 'Opacity',
    hint: 'A percentage, in the label and in a bubble over the thumb',
    maximum: 1,
    step: 0.05,
    format: { style: 'percent' },
    valuePlacement: 'both',
    defaultValue: 0.6,
  }),
  gui.inputs.slider('sliders.rating', {
    label: 'Rating',
    hint: 'Labelled marks, and the value in a bubble only',
    minimum: 1,
    maximum: 5,
    marks: [{ value: 1, label: 'Poor' }, 3, { value: 5, label: 'Great' }],
    valuePlacement: 'bubble',
  }),
  gui.inputs.slider('sliders.disabled', { label: 'Disabled', disabled: true, defaultValue: 30 }),
  gui.inputs.slider('sliders.readonly', { label: 'Read-only', readonly: true, defaultValue: 70 }),
  // A slider lines up with the fields beside it: its marks' labels go under the control.
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('sliders.speaker', { label: 'Speaker', hint: 'Its name in the app' }),
    gui.inputs.slider('sliders.bass', {
      label: 'Bass',
      minimum: -10,
      maximum: 10,
      marks: [
        { value: -10, label: '-10 dB' },
        { value: 0, label: '0' },
        { value: 10, label: '+10 dB' },
      ],
    }),
  ]),
]);
