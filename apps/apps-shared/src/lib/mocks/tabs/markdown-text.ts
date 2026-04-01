export const markdownText = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'display',
      type: 'markdownText',
      props: {
        md: `## Welcome
This is a **markdownText** display widget. It renders _markdown_ content as formatted HTML.

- Use it for structured text
- Use it for rich content display
- Use it for formatted instructions

> **Note:** Remember to provide a markdown parser via the form \`dependencies\` prop.`,
      },
    },
  ],
});
