# GolemUI · Astro Template

A starter for [GolemUI](https://golemui.com) using [Astro](https://astro.build) 7 and [Lit](https://lit.dev) with server-side rendering.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer. Astro renders the complete form on the server through `@golemui/lit/ssr` — widget internals included, no framework in between — and the browser resumes it.

## Quick start

Requires Node.js 22.12 or newer.

```bash
npx degit golemui/golemui/templates/astro my-app
cd my-app
npm install
npm start
```

Open <http://localhost:4321>. View the page source to see the form markup arrive without JavaScript.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/astro)

## What's in here

- [src/form.ts](src/form.ts) — the form definition and the custom currency renderer, shared by the server and the client.
- [src/pages/index.astro](src/pages/index.astro) — the page: the frontmatter preloads the widgets and renders the form to HTML, the script preloads them again in the browser and resumes the form.
- [astro.config.mjs](astro.config.mjs) — renders on request through the Node adapter. Drop `output` and `adapter` to render once at build time instead.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
