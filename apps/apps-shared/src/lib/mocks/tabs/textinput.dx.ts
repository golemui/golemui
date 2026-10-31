import { gui } from '@golemui/gui-shared';

export const textinputTab = gui.layouts.grid([
  gui.inputs.textInput('textinput', { label: 'Text input', autocomplete: 'off' }),
  gui.inputs.textInput('textinputDisabled', {
    label: 'Disabled text input',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.textInput('textinputPhone', {
    label: 'Phone number',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textInput('textinputWithHint', {
    label: 'Text input with hint',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textInput('textinputWithIcon', {
    label: 'Text input with icon',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textInput('textinputIconRight', {
    label: 'Required text input with icon',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    validator: { required: true },
  }),
  gui.inputs.textInput('textinputCustomValidator', {
    label: 'Name',
    hint: 'Try a name other than John or Jane',
    placeholder: 'Enter a name',
    validator: { type: 'custom', allowedNames: ['John', 'Jane'] },
  }),
]);
