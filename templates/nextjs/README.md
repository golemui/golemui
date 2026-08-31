# GolemUI · Next.js Template

A starter for [GolemUI](https://golemui.com) using [Next.js](https://nextjs.org) 15 (App Router) with server-side rendering.

It renders a 5-field signup form (country → city → currency → pets → date) that demonstrates conditional fields, cascading options, and a custom item renderer. Next.js renders the form on the server and hydrates it in the browser.

## Quick start

Requires Node.js 22.19 or newer.

```bash
npx degit golemui/golemui/templates/nextjs my-app
cd my-app
npm install
npm start
```

Open <http://localhost:3000>. View the page source to see the form markup arrive without JavaScript.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/nextjs)

## What's in here

- [src/app/page.tsx](src/app/page.tsx) — the form definition, the custom currency renderer, and the page component.
- [src/app/golemui-provider.tsx](src/app/golemui-provider.tsx) — preloads the widgets before the first render, on the server and on the client.
- [src/app/layout.tsx](src/app/layout.tsx) — loads the GolemUI stylesheet and the Material Icons font.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
