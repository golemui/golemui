import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal server for the harness. Development uses vite in middleware mode.
// Production reads the two build outputs.

const here = dirname(fileURLToPath(import.meta.url));
const clientDir = join(here, '../../dist/apps/lit-ssr-harness/client');
const serverEntry = join(here, '../../dist/apps/lit-ssr-harness/server/entry-server.js');
const isProduction = process.argv.includes('--production');
const port = Number(process.env.PORT ?? 3602);

const contentTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

const send = (res, status, body, contentType = 'text/html') => {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
};

const sendError = (res, error) => {
  console.error(error);
  send(res, 500, String(error?.stack ?? error), 'text/plain');
};

async function startDevelopment() {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: join(here, 'vite.config.mts'),
    server: { middlewareMode: true },
    appType: 'custom',
  });

  return createHttpServer((req, res) => {
    vite.middlewares(req, res, async () => {
      try {
        const template = await vite.transformIndexHtml(
          req.url,
          await readFile(join(here, 'index.html'), 'utf-8'),
        );
        const { render } = await vite.ssrLoadModule('/src/entry-server.ts');
        send(res, 200, template.replace('<!--app-html-->', await render()));
      } catch (error) {
        vite.ssrFixStacktrace(error);
        sendError(res, error);
      }
    });
  });
}

async function startProduction() {
  const template = await readFile(join(clientDir, 'index.html'), 'utf-8');
  const { render } = await import(serverEntry);

  return createHttpServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      const asset = join(clientDir, path);

      if (path !== '/' && asset.startsWith(clientDir)) {
        const file = await readFile(asset).catch(() => null);
        if (file) {
          send(res, 200, file, contentTypes[extname(asset)] ?? 'application/octet-stream');
          return;
        }
      }

      send(res, 200, template.replace('<!--app-html-->', await render()));
    } catch (error) {
      sendError(res, error);
    }
  });
}

const server = isProduction ? await startProduction() : await startDevelopment();
server.listen(port, () => {
  const mode = isProduction ? 'production' : 'development';
  console.log(`lit-ssr-harness (${mode}) on http://localhost:${port}`);
});
