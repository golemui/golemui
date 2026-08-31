export default defineNuxtConfig({
  compatibilityDate: '2026-08-29',
  app: {
    head: {
      title: 'GolemUI Nuxt Template',
      // data-theme is the GolemUI theme hook: `auto` follows the OS color scheme.
      htmlAttrs: { lang: 'en', 'data-theme': 'auto' },
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
    },
  },
  // GolemUI never injects its stylesheet. Load it once here and override the design tokens in
  // your own CSS.
  css: ['@golemui/gui-components/index.css', '~/assets/styles.css'],
});
