import { gui } from '@golemui/gui-shared';

export const textareaTab = gui.layouts.flex([
  gui.inputs.textarea('textarea', { autocomplete: 'off' }),
  gui.inputs.textarea('textareaDisabled', { disabled: true, readonly: true }),
  gui.inputs.textarea('textareaAutoGrow', {
    placeholder: 'This textarea will grow automatically when you type in it.',
    autoGrow: true,
    minimumHeight: 80,
  }),
  gui.inputs.textarea('textareaWithHint', {
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textarea('textareaWithCounter', {
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    counterMode: 'current',
    minimumHeight: 80,
    validator: { maxLength: 10, required: true },
  }),
]);
