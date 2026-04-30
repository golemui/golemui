// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { dslRoutesPlugin } from './src/plugins/dsl-routes';

// https://astro.build/config
export default defineConfig({
  outDir: '../dist/docs',
  integrations: [
    starlight({
      title: 'GolemUI',
      plugins: [dslRoutesPlugin()],
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
        { label: 'Getting Started', autogenerate: { directory: 'getting-started' } },
        { label: 'Integration', autogenerate: { directory: 'integration' } },
        { label: 'Features', autogenerate: { directory: 'features' } },
        { label: 'Extending GolemUI', autogenerate: { directory: 'extending' } },
        { label: 'Form Definition API', autogenerate: { directory: 'form-definition' } },
        { label: 'Styling', autogenerate: { directory: 'styling' } },
        {
          label: 'Widgets Reference',
          items: [
            { label: 'Display Widgets', autogenerate: { directory: 'widgets-reference/display-fields' } },
            { label: 'Input Widgets', autogenerate: { directory: 'widgets-reference/input-fields' } },
            { label: 'Layout Widgets', autogenerate: { directory: 'widgets-reference/layout-fields' } },
            { label: 'Action Widgets', autogenerate: { directory: 'widgets-reference/interactive-fields' } },
          ],
        },
      ],
    }),
  ],
});
