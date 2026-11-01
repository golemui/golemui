import { gui } from '@golemui/gui-shared';

export const tagsTab = gui.layouts.grid([
  gui.inputs.tags('tags.basic', { label: 'Tags', placeholder: 'Add a tag…' }),
  gui.inputs.tags('tags.withIcon', {
    label: 'Tags with icon',
    icon: 'label',
    hint: 'Press Enter, Tab or comma to add a tag',
    placeholder: 'Type and press Enter',
  }),
  gui.inputs.tags('tags.duplicates', {
    label: 'Tags with duplicates',
    hint: 'allowDuplicates lets the same tag be added more than once',
    placeholder: 'Try entering the same tag twice',
    allowDuplicates: true,
  }),
  gui.inputs.tags('tags.limited', {
    label: 'Tags with limited number of tags',
    hint: 'A maxItems validator flags a sixth tag instead of blocking it',
    placeholder: 'Add a tag…',
    validator: { maxItems: 5 },
  }),
  gui.inputs.tags('tags.scrollable', {
    label: 'Tags with scrollable container',
    icon: 'tag',
    hint: 'Many tags scroll horizontally; resize the window to see the count-bubble fallback',
    placeholder: 'Add another…',
  }),
  gui.inputs.tags('tags.validated', {
    label: 'Tags with validation',
    hint: 'At least 1, at most 3 tags — must be unique',
    placeholder: 'Add a tag…',
    validator: { required: true, minItems: 1, maxItems: 3 },
  }),
  gui.inputs.tags('tags.disabled', {
    label: 'Disabled tags',
    placeholder: 'You cannot type here',
    disabled: true,
  }),
  gui.inputs.tags('tags.readonly', {
    label: 'Readonly tags',
    placeholder: 'Read-only',
    readonly: true,
  }),
]);
