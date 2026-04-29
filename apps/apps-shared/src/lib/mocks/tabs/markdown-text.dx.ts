import { gui } from '@golemui/gui-shared';

export const markdownTextTab = gui.layouts.flex([
  gui.displays.custom('markdownText', {
    md: `# Welcome
## Welcome
### Welcome
#### Welcome
##### Welcome
###### Welcome

This is a **markdownText** display widget. It renders _markdown_ content as formatted HTML. You can add links too like this one to [GolemUI](https://golemui.com).

- Use it for structured text
- Use it for rich content display
- Use it for formatted instructions

1. Use it for structured text
2. Use it for rich content display
3. Use it for formatted instructions

> **Note:** Remember to provide a markdown parser via the form \`dependencies\` prop.

\`\`\`
import { markdownText } from '@golem/ui';

console.log('Code blocks are also supported');
\`\`\`
`,
  }),
]);
