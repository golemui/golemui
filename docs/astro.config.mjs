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
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'CSS & Styling', slug: 'guides/styling' },
          ],
        },
        {
          label: 'Components Reference',
          items: [
            // Each item here is one entry in the navigation menu.
            {
              label: 'Fields',
              autogenerate: { directory: 'components-reference/fields' },
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
