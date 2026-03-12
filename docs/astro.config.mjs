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
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/golemui/golemui' }],
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
                // Use requestAnimationFrame to ensure the initial state (e.g. height: 0)
                // is painted before applying the new height, triggering the transition.
                requestAnimationFrame(() => {
                  sourceIframe.style.height = event.data.height + 'px';

                  // If there is a min-height set in the data attribute, apply it
                  const minHeight = sourceIframe.getAttribute('data-min-height');
                  if (minHeight) {
                    sourceIframe.style.minHeight = minHeight;
                  }
                });
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
          label: 'Styling',
          autogenerate: { directory: 'styling' },
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
            {
              label: 'Interactive Fields',
              autogenerate: { directory: 'components-reference/interactive-fields' },
            },
          ],
        },
      ],
    }),
  ],
});
