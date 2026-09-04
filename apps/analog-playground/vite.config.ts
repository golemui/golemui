import analog from '@analogjs/platform';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Vite disposes a sass compiler only when the css plugin of the same resolved config owns
// it. By default Analog resolves one config per environment, so the Angular plugin compiles
// component scss through a fallback compiler that vite never disposes. With sass-embedded
// that compiler is a child process, and the build never exits once its work is done.
// Sharing one config makes the css plugin own the compiler. Building the environments one
// after the other keeps a second environment from replacing a compiler before it is closed.
function disposeSassCompilerAfterBuild(): Plugin {
  return {
    name: 'dispose-sass-compiler-after-build',
    config: () => ({ builder: { sharedConfigBuild: true } }),
    async buildApp(builder) {
      const build = builder.build.bind(builder);
      let previous: Promise<unknown> = Promise.resolve();
      builder.build = (environment) => {
        const current = previous.then(() => build(environment));
        previous = current.catch(() => undefined);
        return current;
      };
    },
  };
}

// The Analog platform plugin compiles the components and must come before the path plugin.
// Playground ports: 3300 lit, 3500 vue, 3700 nuxt, 3800 nextjs, 3900 astro, 4200 angular.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/analog-playground',
  server: { port: 4000 },
  build: {
    // With workspaceRoot set, Analog anchors the ssr/, analog/ and .nitro/ outputs under
    // dist/apps/analog-playground; the client build has to be pointed there explicitly.
    outDir: '../../dist/apps/analog-playground/client',
    emptyOutDir: true,
    target: ['es2022'],
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins: [
    analog({
      workspaceRoot: resolve(__dirname, '../..'),
      // Same split as the Astro playground: the landing page and the modular form are
      // rendered once at build time, the two kitchen sinks render on every request.
      prerender: { routes: ['/', '/dx/modular'], discover: false },
    }),
    nxViteTsPaths(),
    disposeSassCompilerAfterBuild(),
  ],
}));
