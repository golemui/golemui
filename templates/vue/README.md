# GolemUI · Vue Template

A starter for [GolemUI](https://golemui.com) using [Vue](https://vuejs.org) 3 and [Vite](https://vitejs.dev).

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer.

> **Status:** requires GolemUI **v0.14.0 or newer**. Vue support (`@golemui/gui-vue`, `@golemui/vue`) lands in that release. `npm install` will fail against earlier versions.

## Quick start

```bash
npx degit golemui/golemui/templates/vue my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/vue)

## What's in here

- [src/App.vue](src/App.vue) — the form definition and root component.
- [src/CurrencyItemRenderer.vue](src/CurrencyItemRenderer.vue) — the custom Vue currency renderer.
- [src/main.ts](src/main.ts) — Vue bootstrap entry.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
