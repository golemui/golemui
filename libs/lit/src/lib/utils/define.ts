/**
 * Defines a custom element only if the tag is not already registered.
 * First definition wins; never throws on re-registration (duplicate package
 * copies, HMR, or host apps that pre-register gui-* tags).
 * No-ops where customElements is unavailable (SSR / node).
 *
 * Single source of truth for every GolemUI element registration; exposed to
 * the gui-* packages via @golemui/lit/internals.
 */
export function safeDefine(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) {
    return; // TODO: dev-mode collision warn once isDevMode() is exported from @golemui/core
  }
  customElements.define(tag, ctor);
}
