# GolemUI · Angular Template

A starter for [GolemUI](https://golemui.com) using [Angular](https://angular.dev) 20 and the Angular CLI.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer.

## Quick start

```bash
npx degit golemui/golemui/templates/angular my-app
cd my-app
npm install
npm start
```

Open <http://localhost:4200>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/angular)

## What's in here

- [src/app/app.ts](src/app/app.ts) — the form definition and root standalone component.
- [src/app/currency-item-renderer.component.ts](src/app/currency-item-renderer.component.ts) — the custom Angular currency renderer.
- [src/main.ts](src/main.ts) — Angular bootstrap entry.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
