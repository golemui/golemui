import type { StarlightPlugin } from '@astrojs/starlight/types';

export function dslRoutesPlugin(): StarlightPlugin {
  return {
    name: 'dsl-routes',
    hooks: {
      'config:setup'({ updateConfig, addRouteMiddleware }) {
        updateConfig({
          locales: {
            root: { label: 'GolemUI', lang: 'en' },
            dx: { label: 'Programmatic', lang: 'en' },
            json: { label: 'JSON', lang: 'en' },
          },
          components: {
            LanguageSelect: './src/components/overrides/DslSelect.astro',
            SiteTitle: './src/components/overrides/SiteTitle.astro',
            SocialIcons: './src/components/overrides/SocialIcons.astro',
            // Append the shared site footer to every docs/blog page.
            PageFrame: './src/components/overrides/PageFrame.astro',
          },
        });
        addRouteMiddleware({
          entrypoint: './src/route-middleware/dsl-filter.ts',
          order: 'pre',
        });
      },
    },
  };
}
