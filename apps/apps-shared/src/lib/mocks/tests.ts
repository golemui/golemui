import { golemForm } from '@golemui/gui-shared';
import { Example } from './types';

const data = {
  md: `# Markdown editor with Snarkdown
## Formatting text
You can format text using **bold**, _italic_, and ~~strikethrough~~.
> Blockquotes are also supported.
You can add also a link to a website: [Golem UI](https://golemui.com).

By adding # you can create a headings 1 to 6.

## Lists
Unordered lists can be started using the hyphen:
- **option a**
- **option b**
- **option c**

Ordered lists can be started using numbers followed by periods:
1. **one**
2. **two**
3. **three**
`,
};

const form = golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'markdown',
      path: 'md',
      props: {
        tools: ['H', 'B', 'I', 'S', '|', 'OL', 'UL', '|', 'L', 'Q', '|'],
        autoGrow: true,
        defaultOpenPreview: true,
      },
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Login',
      on: {
        click: 'submit',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tests: Example = {
  data,
  form,
  resources,
};
