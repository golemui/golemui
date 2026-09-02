'use client';

import { enableDevMode, preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { use, useEffect, type ReactNode } from 'react';
import { customWidgetLoaders } from './custom-widget-loaders';

// One promise per module graph: the server's SSR layer and the browser bundle each
// evaluate this module once. `use()` suspends the first render on both sides until the
// widgets are in the registry — the App Router equivalent of the Nuxt golemui plugin and
// of the react-ssr-harness entry files. Without a surrounding <Suspense> boundary the
// server waits for the preload before emitting HTML, and the client waits for it before
// hydrating, so the server markup is never overwritten by an empty tree.
const preloadPromise = preloadFormWidgets({
  widgetLoaders: { ...widgetLoaders, ...customWidgetLoaders },
});

export function GolemuiProvider({ children }: { children: ReactNode }) {
  use(preloadPromise);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[GolemUI] DEV mode is enabled');
      enableDevMode();
    }
  }, []);

  return <>{children}</>;
}
