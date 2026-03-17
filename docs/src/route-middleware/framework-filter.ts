import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

const FRAMEWORKS = ['react', 'angular', 'lit'];
const DEFAULT_FRAMEWORK = 'react';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const locale = route.locale;

  if (locale && FRAMEWORKS.includes(locale)) {
    // Framework-specific page: suppress "untranslated content" fallback notice
    route.isFallback = false;
    // Store framework for components like FrameworkTabs to read
    route.framework = locale;
  } else if (!locale) {
    // Root locale page (no framework prefix): redirect to default framework
    const frameworkUrl = `/${DEFAULT_FRAMEWORK}${context.url.pathname}`;
    route.head.push(
      { tag: 'meta', attrs: { 'http-equiv': 'refresh', content: `0;url=${frameworkUrl}` } },
      { tag: 'link', attrs: { rel: 'canonical', href: frameworkUrl } },
    );
  }
});
