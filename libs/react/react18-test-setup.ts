import Module from 'node:module';

/**
 * Runtime part of the REACT18=1 version lock.
 *
 * The vite alias rewrites the `react` and `react-dom` imports in transformed source, but
 * vitest loads node_modules natively, so the `require('react')` calls inside the
 * `react18` and `react18-dom` packages still resolve to the hoisted React 19 and the two
 * versions crash on each other's internals. This hook redirects exactly those calls to
 * the `react18` package, which keeps a single React 18 instance across the whole run.
 */
const moduleInternals = Module as unknown as {
  _resolveFilename: (request: string, parent: { filename?: string }, ...rest: unknown[]) => string;
};

const originalResolveFilename = moduleInternals._resolveFilename;
const isInsideReact18Package = (filename: string | undefined) =>
  filename !== undefined && /node_modules\/react18(-dom)?\//.test(filename);

moduleInternals._resolveFilename = function (request, parent, ...rest) {
  if (request === 'react' && isInsideReact18Package(parent?.filename)) {
    return originalResolveFilename.call(this, 'react18', parent, ...rest);
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};
