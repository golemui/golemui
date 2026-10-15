import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import stylesUrl from '../styles.scss?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Playground' },
    ],
    // Linked from the document, so the server HTML is styled before any JavaScript runs.
    links: [
      { rel: 'stylesheet', href: stylesUrl },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
  // Any unknown URL, such as the /.well-known/appspecific/com.chrome.devtools.json that Chrome
  // requests while DevTools is open. Without it the router warns and renders a bare "Not Found".
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <Link to="/">Back to the playground</Link>
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // data-theme is the GolemUI theme hook, same as the Next.js and Nuxt playgrounds.
    <html lang="en" data-theme="auto">
      <head>
        <HeadContent />
      </head>
      <body>
        <main className="container">{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
