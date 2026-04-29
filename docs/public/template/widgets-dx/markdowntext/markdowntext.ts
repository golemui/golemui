import { gui } from '@golemui/gui-shared';

export default [
  gui.displays.custom('markdownText', {
    md: `## Welcome

This is a **markdownText** display widget. It renders _markdown_ content as formatted HTML.

- Use it for structured text
- Use it for rich content display
- Use it for formatted instructions`,
    uid: 'markdowntext_demo',
  }),
];
