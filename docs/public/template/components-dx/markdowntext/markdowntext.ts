import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'markdowntext_demo',
      kind: 'display',
      type: 'markdownText',
      props: {
        md: '## Welcome

This is a **markdownText** display widget. It renders _markdown_ content as formatted HTML.

- Use it for structured text
- Use it for rich content display
- Use it for formatted instructions',
      },
    },
  ],
});
