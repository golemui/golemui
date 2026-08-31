# GolemUI · Nuxt Template

A starter for [GolemUI](https://golemui.com) using [Nuxt](https://nuxt.com) 4 with server-side rendering.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer. Nuxt renders the form on the server and hydrates it in the browser.

## Quick start

Requires Node.js 22.19 or newer.

```bash
npx degit golemui/golemui/templates/nuxt my-app
cd my-app
npm install
npm start
```

Open <http://localhost:3000>. View the page source to see the form markup arrive without JavaScript.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/nuxt)

## What's in here

- [app/pages/index.vue](app/pages/index.vue) — the form definition and page component.
- [app/components/CurrencyItemRenderer.vue](app/components/CurrencyItemRenderer.vue) — the custom Vue currency renderer.
- [app/plugins/golemui.ts](app/plugins/golemui.ts) — preloads the widgets before the first render.
- [nuxt.config.ts](nuxt.config.ts) — loads the GolemUI stylesheet and the Material Icons font.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
