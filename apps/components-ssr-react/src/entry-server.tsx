import { renderToString } from 'react-dom/server';
// Lets the React components render their content on the server, not just their tags.
import '@golemui/gui-components/ssr';
import { App } from './App';

/** Renders the page to a string. Called once per request by server.mjs. */
export async function render(): Promise<string> {
  return renderToString(<App />);
}
