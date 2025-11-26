// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  outDir: '../dist/docs',
  integrations: [
    starlight({
      title: 'GolemUI',
      customCss: ['./src/styles/custom.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/golemui/formforge' }],
      sidebar: [
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Components Reference',
          items: [
            // Each item here is one entry in the navigation menu.
            {
              label: 'Display Fields',
              autogenerate: { directory: 'components-reference/display-fields' },
            },
            {
              label: 'Control Fields',
              autogenerate: { directory: 'components-reference/control-fields' },
            },
            {
              label: 'Layout Fields',
              autogenerate: { directory: 'components-reference/layout-fields' },
            },
          ],
        },
      ],
    }),
    react(),
  ],
});
