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
  tagByConstructor.set(ctor, tag);
}

const tagByConstructor = new Map<CustomElementConstructor, string>();

/**
 * Returns the tag a constructor was registered with through {@link safeDefine}, or
 * undefined for a constructor that was never registered with it. Works in every
 * runtime, including registries without `customElements.getName`.
 */
export function tagNameOf(ctor: CustomElementConstructor): string | undefined {
  return tagByConstructor.get(ctor);
}

const deferHydrationPatched = new WeakSet<CustomElementConstructor>();

type PatchablePrototype = HTMLElement & {
  connectedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, value: string | null): void;
};

type ObservedAttributesGetter = (this: CustomElementConstructor) => string[] | undefined;

const installedObservedAttributesGetters = new WeakSet<ObservedAttributesGetter>();

/**
 * Returns the `observedAttributes` implementation of the class or the first ancestor
 * that this file did not install itself.
 *
 * A subclass inherits the getter installed on its base class. Reading that inherited
 * getter returns the base class attributes and skips `ReactiveElement.finalize()`,
 * which Lit only runs from its own getter.
 */
function originalObservedAttributesOf(
  ctor: CustomElementConstructor,
): ObservedAttributesGetter | undefined {
  for (let current: object | null = ctor; current; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, 'observedAttributes');
    if (!descriptor) {
      continue;
    }
    if (descriptor.get) {
      const getter = descriptor.get as ObservedAttributesGetter;
      if (!installedObservedAttributesGetters.has(getter)) {
        return getter;
      }
      continue;
    }
    const value = descriptor.value as string[] | undefined;
    return () => value;
  }
  return undefined;
}

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

  // Calls through with the receiving class, so Lit finalizes that class and reports its
  // own attributes. A snapshot taken here would freeze a subclass to its base class list.
  const originalObservedAttributes = originalObservedAttributesOf(ctor);
  const observedAttributes: ObservedAttributesGetter = function (this: CustomElementConstructor) {
    return [...(originalObservedAttributes?.call(this) ?? []), 'defer-hydration'];
  };
  installedObservedAttributesGetters.add(observedAttributes);
  Object.defineProperty(ctor, 'observedAttributes', {
    configurable: true,
    get: observedAttributes,
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
