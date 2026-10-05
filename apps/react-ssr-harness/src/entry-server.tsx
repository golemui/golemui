import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

/**
 * Renders the harness form to a string. Called once per request by server.mjs.
 *
 * The preload has to finish before the render: the server cannot await a dynamic
 * import while producing a string.
 */
export async function render(): Promise<string> {
  await preloadFormWidgets({ widgetLoaders });
  return renderToString(<App />);
}
