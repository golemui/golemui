import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    headingTitle: 'Add heading',
    boldTitle: 'Bold text',
    italicTitle: 'Italic text',
    strikethroughTitle: 'Strikethrough text',
    quoteTitle: 'Add quote',
    linkTitle: 'Insert link',
    orderedListTitle: 'Ordered list',
    unorderedListTitle: 'Bullet list',
    splitViewTitle: 'Toggle preview',
    label: 'Content',
  }),
];
