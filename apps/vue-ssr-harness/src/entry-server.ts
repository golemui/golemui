import { renderToString } from 'vue/server-renderer';
import { createHarnessApp } from './create-app';

/** Renders the harness form to a string. Called once per request by server.mjs. */
export async function render(): Promise<string> {
  const app = await createHarnessApp();
  return renderToString(app);
}
