import type { StarlightPlugin } from '@astrojs/starlight/types';

export function frameworkRoutesPlugin(): StarlightPlugin {
  return {
    name: 'framework-routes',
    hooks: {
      'config:setup'({ updateConfig, addRouteMiddleware }) {
        updateConfig({
          locales: {
            root: { label: 'GolemUI', lang: 'en' },
            react: { label: 'React', lang: 'en' },
            angular: { label: 'Angular', lang: 'en' },
            lit: { label: 'Lit', lang: 'en' },
          },
          components: {
            LanguageSelect: './src/components/overrides/FrameworkSelect.astro',
            SiteTitle: './src/components/overrides/SiteTitle.astro',
          },
        });
        addRouteMiddleware({
          entrypoint: './src/route-middleware/framework-filter.ts',
          order: 'pre',
        });
      },
    },
  };
}
