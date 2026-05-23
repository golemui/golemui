import { gui } from '@golemui/gui-shared';

export const tagsTab = gui.layouts.flex([
  gui.inputs.tags('tags.basic', { placeholder: 'Add a tag…' }),
  gui.inputs.tags('tags.withIcon', {
    label: 'Tags with icon',
    icon: 'label',
    hint: 'Press Enter, Tab or comma to add a tag',
    placeholder: 'Type and press Enter',
  }),
  gui.inputs.tags('tags.noDuplicates', {
    label: 'Tags with no duplicates',
    hint: 'Duplicate tags are silently ignored',
    placeholder: 'Try entering the same tag twice',
    allowDuplicates: false,
  }),
  gui.inputs.tags('tags.limited', {
    label: 'Tags with limited number of tags',
    hint: 'Up to 5 tags',
    placeholder: 'Add a tag…',
    limit: 5,
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
