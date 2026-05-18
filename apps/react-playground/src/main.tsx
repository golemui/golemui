import { enableDevMode } from '@golemui/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/app';

import { BrowserRouter } from 'react-router';

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
