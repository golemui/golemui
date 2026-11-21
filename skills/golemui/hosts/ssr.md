# GolemUI — server rendering

What every server render shares, in Next.js, Angular SSR and Analog, Nuxt, and Astro or a plain
Node server. Each host file has its own wiring: [react.md](react.md), [angular.md](angular.md),
[vue.md](vue.md), [lit.md](lit.md).

## How it works

- Widgets load through dynamic imports, which a server render cannot wait for.
  `preloadFormWidgets({ widgetLoaders })` from `@golemui/core` loads them before the first
  render, on the server and again on the client. Without it the server HTML holds no widget.
- The registry of loaded widgets is global to the process and shared across requests. That is
  safe, because its entries are widget modules, and one preload warms every later render.
- Validation runs on its triggers, and an error shows only once its field is touched, so the
  server HTML of an untouched form has no error markup.
- Handlers (`formSubmit`, `formEvent`, the events of `on`) run in the browser only. On the
  server, the `formHealth` listener is called once, with `{ status: 'ok' }`, or with the error
  when the definition has one.
- The server render uses the standard `crypto` (`randomUUID`) and `Intl`. CI runs it on the
  Node version of the repository's `.nvmrc` (24).

Starters in the GolemUI repository: `templates/nextjs` (React), `templates/analog` (Angular),
`templates/nuxt` (Vue), `templates/astro` (Lit).

## Rules

### rule: ssr-form-name

When: server rendering a form in React, Angular or Lit.

Do: set `formName` in the config, the same on the server and the client.

Wrong:

- Doing: no `formName`.

  Because: the server and the client each make a random name, so the ids in the server HTML are not the client's; Lit's `renderForm` throws without one.

Applies: ssr, nextjs, angular, lit, astro

Source: libs/lit/src/lib/ssr/server.ts#renderForm

### rule: ssr-one-loaders-object

When: a server-rendered form uses custom widgets.

Do: keep their loaders in one object at module scope, spread it into the `preloadFormWidgets` call, and pass the same object as `customWidgetLoaders`.

Wrong:

- Doing: writing the loaders object inside a component, `customWidgetLoaders: { rating: () => import('./rating') }`.

  Because: the registry keys the loaded widgets by loader function, and a new function misses the preloaded one.

Applies: ssr, custom-widgets, nextjs, angular, vue, lit

Source: libs/core/src/lib/context/widget-registry.ts

### rule: ssr-dependencies-run-in-node

When: a server-rendered form has `dependencies`, such as a markdown parser.

Do: use a dependency that runs in Node and gives the same output on the server and the client.

Wrong:

- Doing: a markdown parser that needs `document` or `window`.

  Because: the server render calls it in Node, where neither exists.

Applies: ssr, dependencies, markdownText

Source: libs/dx/src/lib/widgetSetForm.ts#buildWidgetSetForm
