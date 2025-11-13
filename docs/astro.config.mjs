// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  outDir: '../dist/docs',
  integrations: [
    starlight({
      title: 'GolemUI',
      customCss: ['./src/styles/custom.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
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
  ],
});
