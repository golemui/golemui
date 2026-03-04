// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  outDir: '../dist/docs',
  integrations: [
    starlight({
      title: 'GolemUI',
      customCss: ['./src/styles/custom.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/golemui/formforge' }],
      head: [
        {
          tag: 'script',
          content: `
          // Listen for messages from the iframes
          window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'golemui-resize') {
              const iframes = document.querySelectorAll('.demo-iframe');
              const sourceIframe = Array.from(iframes).find(
                (iframe) => iframe.contentWindow === event.source
              );

              if (sourceIframe) {
                sourceIframe.style.height = event.data.height + 'px';
              }
            }
          });
          `
        }
      ],
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
              label: 'Input Fields',
              autogenerate: { directory: 'components-reference/input-fields' },
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
