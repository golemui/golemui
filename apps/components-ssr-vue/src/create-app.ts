import { createSSRApp, type App } from 'vue';
import Root from './App.vue';
import './elements';

/** Builds the app for the server entry and the client entry. */
export function createPageApp(): App {
  return createSSRApp(Root);
}
