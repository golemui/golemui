import { enableDevMode } from '@golemui/core';
import { iframeResizer } from '@golemui/apps-shared';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.scss';

if (import.meta.env.DEV) {
  enableDevMode();
}

// When embedded on the /demos page, report our content height so the host can
// grow the iframe — the whole page scrolls instead of the demo scrolling itself.
iframeResizer();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
