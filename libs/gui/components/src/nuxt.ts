// The Nuxt module: `modules: ['@golemui/gui-components/nuxt']` in nuxt.config.ts. It needs
// @nuxt/kit, which every Nuxt app has, and @lit-labs/ssr for the server rendering.
import { addServerPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';

export interface ModuleOptions {
  /**
   * Renders the content of the elements into the server HTML (default true). Without it, Nuxt
   * sends their tags empty and the elements render in the browser.
   */
  serverRendering: boolean;
  /**
   * The tag prefixes Vue compiles as custom elements (default `['gui-']`). Add the prefix of a
   * widget set of your own.
   */
  prefixes: string[];
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@golemui/gui-components',
    configKey: 'golemui',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    serverRendering: true,
    prefixes: ['gui-'],
  },
  setup(options, nuxt) {
    // Vue compiles the tags as custom elements, keeping any rule the app already has.
    const compilerOptions = (nuxt.options.vue.compilerOptions ??= {});
    const isCustomElement = compilerOptions.isCustomElement;
    compilerOptions.isCustomElement = (tag) =>
      options.prefixes.some((prefix) => tag.startsWith(prefix)) || !!isCustomElement?.(tag);

    if (options.serverRendering) {
      const { resolve } = createResolver(import.meta.url);
      addServerPlugin(resolve('./nuxt-server-plugin'));
    }
  },
});
