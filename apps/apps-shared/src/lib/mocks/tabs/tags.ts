export const tags = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.basic',
      props: {
        placeholder: 'Add a tag…',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.withIcon',
      label: 'Tags with icon',
      props: {
        icon: 'label',
        hint: 'Press Enter, Tab or comma to add a tag',
        placeholder: 'Type and press Enter',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.noDuplicates',
      label: 'Tags with no duplicates',
      props: {
        hint: 'Duplicate tags are silently ignored',
        placeholder: 'Try entering the same tag twice',
        allowDuplicates: false,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.limited',
      label: 'Tags with limited number of tags',
      props: {
        hint: 'Up to 5 tags',
        placeholder: 'Add a tag…',
        limit: 5,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.scrollable',
      label: 'Tags with scrollable container',
      props: {
        icon: 'tag',
        hint: 'Many tags scroll horizontally; resize the window to see the count-bubble fallback',
        placeholder: 'Add another…',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.validated',
      label: 'Tags with validation',
      props: {
        hint: 'At least 1, at most 3 tags — must be unique',
        placeholder: 'Add a tag…',
      },
      validator: { type: 'array', required: true, minItems: 1, maxItems: 3 },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.disabled',
      label: 'Disabled tags',
      disabled: true,
      props: {
        placeholder: 'You cannot type here',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'tags',
      path: 'tags.readonly',
      label: 'Readonly tags',
      readonly: true,
      props: {
        placeholder: 'Read-only',
      },
    },
  ],
});
