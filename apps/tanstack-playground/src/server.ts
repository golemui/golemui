// Server only: the GolemUI elements render their content into the HTML, instead of
// staying empty until the browser upgrades them. Needs @lit-labs/ssr.
import '@golemui/gui-components/ssr';
import {
  createStartHandler,
  defaultRenderHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';
import { golemuiReady } from './golemui';

// TanStack Start streams by default; GolemUI documents string rendering. SSR_STREAM=1 switches
// to the streaming handler, to check that both hydrate the same.
const handler = createStartHandler(
  process.env['SSR_STREAM'] === '1' ? defaultStreamHandler : defaultRenderHandler,
);

export default createServerEntry({
  async fetch(request, opts) {
    await golemuiReady;
    return handler(request, opts);
  },
});
