import analog from '@analogjs/platform';
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

// Analog derives `ngServerMode` from the top-level `build.ssr`, which is unset. So the server
// bundle gets `false`, and Angular runs browser-only code such as `afterNextRender` on the server.
function defineServerModeForSsrBuild(): Plugin {
  return {
    name: 'define-ng-server-mode-for-ssr-build',
    config: () => ({ environments: { ssr: { define: { ngServerMode: 'true' } } } }),
  };
}

export default defineConfig({
  build: {
    target: ['es2022'],
  },
  // Server-side rendering is on by default: every page renders on request, and `/` is
  // prerendered at build time.
  plugins: [analog(), disposeSassCompilerAfterBuild(), defineServerModeForSsrBuild()],
});
