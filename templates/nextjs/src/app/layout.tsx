import type { ReactNode } from 'react';
import { GolemuiProvider } from './golemui-provider';
// GolemUI never injects its stylesheet. Load it once here and override the design tokens in
// your own CSS.
import '@golemui/gui-components/index.css';
import './styles.css';

export const metadata = {
  title: 'GolemUI Next.js Template',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is the GolemUI theme hook: `auto` follows the OS color scheme.
    <html lang="en" data-theme="auto">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body>
        <main>
          <GolemuiProvider>{children}</GolemuiProvider>
        </main>
      </body>
    </html>
  );
}
