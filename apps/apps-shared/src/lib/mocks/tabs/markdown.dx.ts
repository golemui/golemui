import { gui } from '@golemui/gui-shared';

export const markdownTab = gui.layouts.flex([
  gui.inputs.markdown('markdown', { autocomplete: 'off' }),
  gui.inputs.markdown('markdownDisabled', { disabled: true, readonly: true }),
  gui.inputs.markdown('markdownAutoGrow', {
    placeholder: 'This editor will grow automatically when you type in it.',
    autoGrow: true,
    minimumHeight: 80,
  }),
  gui.inputs.markdown('markdownWithHint', {
    hint: 'This is a hint',
    placeholder: 'Write some markdown here',
  }),
  gui.inputs.markdown('markdownWithPreview', {
    defaultOpenPreview: true,
    counterMode: 'current',
    minimumHeight: 80,
    validator: { maxLength: 500, required: true },
  }),
]);
