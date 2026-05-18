import { enableDevMode } from '@golemui/core';
import { createApp } from 'vue';
import App from './app/App.vue';

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

createApp(App).mount('#root');
