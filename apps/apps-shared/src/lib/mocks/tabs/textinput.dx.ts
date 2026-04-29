import { gui } from '@golemui/gui-shared';

export const textinputTab = gui.layouts.flex([
  gui.inputs.textInput('textinput', { autocomplete: 'off' }),
  gui.inputs.textInput('textinputDisabled', { disabled: true, readonly: true }),
  gui.inputs.textInput('textinputPhone', { placeholder: 'Please enter your phone number' }),
  gui.inputs.textInput('textinputWithHint', {
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textInput('textinputWithIcon', {
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textInput('textinputIconRight', {
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    validator: { required: true },
  }),
]);
