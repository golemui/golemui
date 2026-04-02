export const markdown = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'markdown',
      path: 'markdown',
    },
    {
      uid: '',
      kind: 'input',
      type: 'markdown',
      path: 'markdownDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'markdown',
      path: 'markdownAutoGrow',
      props: {
        placeholder: 'This editor will grow automatically when you type in it.',
        autoGrow: true,
        minimumHeight: 80,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'markdown',
      path: 'markdownWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Write some markdown here',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'markdown',
      path: 'markdownWithPreview',
      props: {
        defaultOpenPreview: true,
        counterMode: 'current',
        minimumHeight: 80,
      },
      validator: { type: 'string', maxLength: 500, required: true },
    },
  ],
});
