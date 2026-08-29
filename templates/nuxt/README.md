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

## Server rendering

- **Preload the widgets.** `<GuiForm>` loads widgets on demand through dynamic imports, which a server render cannot wait for. The plugin awaits `preloadFormWidgets({ widgetLoaders })` from `@golemui/core`; Nuxt runs it before the first render on the server and on the client, so both sides render the same tree.
- **Custom widgets.** Keep their loaders in one module-scope object, spread it into the `preloadFormWidgets` call and pass the same object as `customWidgetLoaders` in the form config. The registry caches preloaded components by loader function identity, so an object literal recreated per component would miss the cache.
- **Stable ids.** Vue 3.5+ gives the form the same id on both sides; a `formName` additionally makes it predictable in the markup.
- **What the server renders.** The Vue layer of the form: `<form>`, the layouts and the `gui-*` elements with their attributes and values. The `gui-*` elements are Lit custom elements and render their internals once the browser has upgraded them.
- **Events.** `onLoad` fires in the browser once a widget has mounted, never during the server render. Like every other handler it may use browser APIs.
- **Styles.** Nothing is injected: `nuxt.config.ts` loads `@golemui/gui-components/index.css` and the Material Icons font. Override the design tokens in `app/assets/styles.css`.
- **Your own `gui-*` tags.** `<GuiForm>` needs no compiler configuration. Only when one of your own components puts a `gui-*` element in its template, add `vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } }` to `nuxt.config.ts` and bind its object props with `.prop`.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
