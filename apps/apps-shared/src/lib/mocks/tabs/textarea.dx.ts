import { gui } from '@golemui/gui-shared';

export const textareaTab = gui.layouts.grid([
  gui.inputs.textarea('textarea', { label: 'Textarea', autocomplete: 'off' }),
  gui.inputs.textarea('textareaDisabled', {
    label: 'Disabled textarea',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.textarea('textareaAutoGrow', {
    label: 'Auto-growing textarea',
    placeholder: 'This textarea will grow automatically when you type in it.',
    autoGrow: true,
    minimumHeight: 80,
  }),
  gui.inputs.textarea('textareaWithHint', {
    label: 'Textarea with hint',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.textarea('textareaWithCounter', {
    label: 'Textarea with counter',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    counterMode: 'current',
    minimumHeight: 80,
    validator: { maxLength: 10, required: true },
  }),
]);
