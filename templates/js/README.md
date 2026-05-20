# GolemUI · Vanilla JS Template

A starter for [GolemUI](https://golemui.com) using **no UI framework** — just web components from `@golemui/gui-lit` driven by plain JavaScript.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer.

## Quick start

```bash
npx degit golemui/golemui/templates/js my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/js)

## What's in here

- [src/main.js](src/main.js) — registers the `<gui-form>` web component, builds the form definition, and wires the renderer + submit handler.
- [index.html](index.html) — places `<gui-form id="app-form"></gui-form>` in the page.

The currency renderer is plain `document.createElement` — no framework, no templating runtime. The renderer returns a `Node`, which `<gui-form>` mounts directly.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
