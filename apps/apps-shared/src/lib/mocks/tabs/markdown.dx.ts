import { gui } from '@golemui/gui-shared';

export const markdownTab = gui.layouts.grid([
  gui.inputs.markdown('markdown', { label: 'Markdown', autocomplete: 'off' }),
  gui.inputs.markdown('markdownDisabled', {
    label: 'Disabled markdown',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.markdown('markdownAutoGrow', {
    label: 'Auto-growing markdown',
    placeholder: 'This editor will grow automatically when you type in it.',
    autoGrow: true,
    minimumHeight: 80,
  }),
  gui.inputs.markdown('markdownWithHint', {
    label: 'Markdown with hint',
    hint: 'This is a hint',
    placeholder: 'Write some markdown here',
  }),
  gui.inputs.markdown('markdownWithPreview', {
    label: 'Markdown with preview',
    defaultOpenPreview: true,
    counterMode: 'current',
    minimumHeight: 80,
    validator: { maxLength: 500, required: true },
  }),
]);
