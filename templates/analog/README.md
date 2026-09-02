# GolemUI · Analog Template

A starter for [GolemUI](https://golemui.com) using [Analog](https://analogjs.org) 2 and [Angular](https://angular.dev) 21 with server-side rendering and hydration.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer. The server renders the form structure with Angular, the browser hydrates it and upgrades the widgets in place.

## Quick start

Requires Node.js 22 or newer.

```bash
npx degit golemui/golemui/templates/analog my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>. View the page source to see the form markup arrive without JavaScript: every `gui-*` element carries `defer-hydration` until the browser takes over.

`npm run build` writes the Nitro server to `dist/analog`; `npm run preview` serves it on <http://localhost:3000>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/analog)

## What's in here

- [src/app/pages/index.page.ts](src/app/pages/index.page.ts) — the form definition and the page component. The explicit `formName` keeps the server and the browser on the same form id.
- [src/app/currency-item-renderer.component.ts](src/app/currency-item-renderer.component.ts) — the custom Angular currency renderer.
- [src/main.server.ts](src/main.server.ts) — preloads the widgets, then hands the request to Analog's `render()`.
- [src/main.ts](src/main.ts) — preloads the widgets, then bootstraps with `provideClientHydration()`.
- [vite.config.ts](vite.config.ts) — the Analog platform plugin; SSR is on by default.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
- [Analog docs](https://analogjs.org/docs)
