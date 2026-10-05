import type { ReactNode } from 'react';
// Server only (the layout is a Server Component): the GolemUI elements render their content on
// the server.
import '@golemui/gui-components/ssr';
import { GolemuiProvider } from '../components/golemui-provider';
import '../styles.scss';

export const metadata = {
  title: 'Nextjs Playground',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is the GolemUI theme hook, same as the Nuxt playground's htmlAttrs.
    <html lang="en" data-theme="auto">
      <body>
        <main className="container">
          <GolemuiProvider>{children}</GolemuiProvider>
        </main>
      </body>
    </html>
  );
}
