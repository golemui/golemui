import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

const DSL_MODES = ['dx', 'json'];
const DEFAULT_DSL = 'dx';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const locale = route.locale;

  if (locale && DSL_MODES.includes(locale)) {
    // DSL-specific page: suppress "untranslated content" fallback notice
    route.isFallback = false;
    // Store DSL mode for components like DslTabs to read
    route.dsl = locale;
  } else if (!locale) {
    // The blog is DSL-agnostic and lives at the clean root URL (/blog),
    // so it is exempt from the redirect into the DSL namespace.
    const isBlog = context.url.pathname === '/blog' || context.url.pathname.startsWith('/blog/');
    // Root locale page (no DSL prefix): redirect to default DSL.
    // Guard against 404 pages that have no locale but already contain a DSL
    // prefix in the URL — without this check a missing page causes an infinite
    // redirect loop (e.g. /dx/asdf → /dx/dx/asdf → …).
    const alreadyHasDsl = DSL_MODES.some(
      (mode) => context.url.pathname === `/${mode}` || context.url.pathname.startsWith(`/${mode}/`),
    );
    if (!alreadyHasDsl && !isBlog) {
      const dslUrl = `/${DEFAULT_DSL}${context.url.pathname}`;
      route.head.push(
        { tag: 'meta', attrs: { 'http-equiv': 'refresh', content: `0;url=${dslUrl}` } },
        { tag: 'link', attrs: { rel: 'canonical', href: dslUrl } },
      );
    }
  }
});
