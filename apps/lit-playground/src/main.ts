import { enableDevMode } from '@golemui/core';
import './app/app.element';

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}
