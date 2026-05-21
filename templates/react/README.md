# GolemUI · React Template

A starter for [GolemUI](https://golemui.com) using [React](https://react.dev) 19 and [Vite](https://vitejs.dev).

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer.

## Quick start

```bash
npx degit golemui/golemui/templates/react my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/react)

## What's in here

- [src/App.tsx](src/App.tsx) — the form definition and the `CurrencyItemRenderer` React component.
- [src/main.tsx](src/main.tsx) — React entry point.
- [index.html](index.html) — Vite entry point.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
