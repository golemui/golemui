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
  supportDeferHydrationAttribute(ctor);
  customElements.define(tag, ctor);
}

const deferHydrationPatched = new WeakSet<CustomElementConstructor>();

type PatchablePrototype = HTMLElement & {
  connectedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, value: string | null): void;
};

/**
 * Implements the `defer-hydration` community protocol: an element that connects with a
 * `defer-hydration` attribute does not render until the attribute is removed.
 *
 * The elements render into light DOM, so without this an element that upgrades between
 * a server render and the framework's hydration pass fills itself with children the
 * server markup did not have, and hydration fails on the extra nodes. A hydration
 * entry point renders the attribute into the markup and removes it after hydration
 * (the @lit/react wrappers already remove it on mount). Nothing sets the attribute in
 * a client-only app, where this changes nothing.
 *
 * Installed here because upgrades of already-parsed elements run inside
 * `customElements.define`, so a later patch would miss the first connection.
 */
function supportDeferHydrationAttribute(ctor: CustomElementConstructor): void {
  if (deferHydrationPatched.has(ctor)) {
    return;
  }
  deferHydrationPatched.add(ctor);

  // `observedAttributes` is read once by `customElements.define`, right after this runs.
  const staticSide = ctor as CustomElementConstructor & { observedAttributes?: string[] };
  const observedAttributes = [...(staticSide.observedAttributes ?? [])];
  Object.defineProperty(ctor, 'observedAttributes', {
    configurable: true,
    get: () => [...observedAttributes, 'defer-hydration'],
  });

  const prototype = ctor.prototype as PatchablePrototype;
  const originalConnectedCallback = prototype.connectedCallback;
  const originalAttributeChangedCallback = prototype.attributeChangedCallback;

  prototype.connectedCallback = function (this: PatchablePrototype) {
    if (this.hasAttribute('defer-hydration')) {
      return;
    }
    originalConnectedCallback?.call(this);
  };

  prototype.attributeChangedCallback = function (
    this: PatchablePrototype,
    name: string,
    oldValue: string | null,
    value: string | null,
  ) {
    if (name === 'defer-hydration') {
      if (value === null && this.isConnected) {
        originalConnectedCallback?.call(this);
      }
      return;
    }
    originalAttributeChangedCallback?.call(this, name, oldValue, value);
  };
}
