import { enableDevMode } from '@golemui/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.scss';

if (import.meta.env.DEV) {
  enableDevMode();
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
