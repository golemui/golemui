import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { hydrateRoot } from 'react-dom/client';
import { App } from './App';

// The preload has to finish before hydration, or the client's first render would place
// an empty tree over server markup that is not empty.
// styles.scss is linked from index.html, so the page is styled with JavaScript disabled.
preloadFormWidgets({ widgetLoaders }).then(() => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('The root element is missing from index.html');
  }
  hydrateRoot(container, <App />, {
    // Logs hydration mismatches to the console, where the harness check looks.
    onRecoverableError: (error) => console.error(error),
  });
});
