import { enableDevMode } from '@golemui/core';
import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

createApp(App).use(router).mount('#root');
