import type { ReactNode } from 'react';
// Server only (the layout is a Server Component): lets the React components render their content
// on the server, in build-time prerendering and in request rendering alike.
import '@golemui/gui-components/ssr';
import '../styles.scss';

export const metadata = {
  title: 'GolemUI Components: Next.js server rendering',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="auto">
      <body>{children}</body>
    </html>
  );
}
