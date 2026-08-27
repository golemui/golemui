/**
 * Single registration point for every GolemUI element, exposed to the gui-* packages
 * via @golemui/lit/internals. First definition wins and re-registration never throws
 * (duplicate package copies, HMR, pre-registered gui-* tags).
 *
 * In Node with lit loaded, `customElements` is the @lit-labs/ssr-dom-shim registry,
 * so registration is real there too.
 */
export function safeDefine(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) {
    return; // TODO: dev-mode collision warn once isDevMode() is exported from @golemui/core
  }
  customElements.define(tag, ctor);
}
