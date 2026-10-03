// The registration state lives on globalThis rather than in this module, so a duplicate install
// of this package (two versions in one bundle, or a copy nested under another package) shares
// it: every copy then knows every GolemUI element.

type ObservedAttributesGetter = (this: CustomElementConstructor) => string[] | undefined;

interface ElementRegistry {
  /** The tag each constructor was registered with through safeDefine. */
  tagByConstructor: Map<CustomElementConstructor, string>;
  /** Called once per registration, see onElementRegistered. */
  listeners: Set<(ctor: CustomElementConstructor) => void>;
  deferHydrationPatched: WeakSet<CustomElementConstructor>;
  installedObservedAttributesGetters: WeakSet<ObservedAttributesGetter>;
}

const REGISTRY_KEY = Symbol.for('golemui.element-registry');

const registry: ElementRegistry = ((globalThis as Record<symbol, ElementRegistry | undefined>)[
  REGISTRY_KEY
] ??= {
  tagByConstructor: new Map(),
  listeners: new Set(),
  deferHydrationPatched: new WeakSet(),
  installedObservedAttributesGetters: new WeakSet(),
});

/**
 * Registers a custom element for GolemUI. Every GolemUI element and every custom widget
 * that must server-render goes through it. Only elements registered here run
 * `connectedCallback` on the server and stay inert under `defer-hydration` on the client.
 *
 * The first definition wins and a repeated registration never throws (duplicate package
 * copies, HMR, pre-registered gui-* tags). In Node with lit loaded, `customElements` is
 * the @lit-labs/ssr-dom-shim registry, so the registration is real there too.
 *
 * @param tag - The custom element tag name.
 * @param ctor - The element class to register under `tag`.
 * @example
 * import { safeDefine } from '@golemui/lit';
 *
 * // Not @customElement and not customElements.define, or the widget will not server-render.
 * safeDefine('app-heading', HeadingElement);
 */
export function safeDefine(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) {
    return; // TODO: dev-mode collision warn once isDevMode() is exported from @golemui/core
  }
  supportDeferHydrationAttribute(ctor);
  customElements.define(tag, ctor);
  registry.tagByConstructor.set(ctor, tag);
  for (const listener of registry.listeners) {
    listener(ctor);
  }
}

type PatchablePrototype = HTMLElement & {
  connectedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, value: string | null): void;
};

/**
 * Returns the `observedAttributes` implementation of the class or the first ancestor
 * that safeDefine did not install itself.
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
      if (!registry.installedObservedAttributesGetters.has(getter)) {
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
  if (registry.deferHydrationPatched.has(ctor)) {
    return;
  }
  registry.deferHydrationPatched.add(ctor);

  // Calls through with the receiving class, so Lit finalizes that class and reports its
  // own attributes. A snapshot taken here would freeze a subclass to its base class list.
  const originalObservedAttributes = originalObservedAttributesOf(ctor);
  const observedAttributes: ObservedAttributesGetter = function (this: CustomElementConstructor) {
    return [...(originalObservedAttributes?.call(this) ?? []), 'defer-hydration'];
  };
  registry.installedObservedAttributesGetters.add(observedAttributes);
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

// ─── Registry readers ───

/**
 * Registers a listener for {@link safeDefine} registrations. It runs once for every
 * constructor already registered, then once per later registration.
 *
 * The @golemui/lit server entry point uses it to add the server-only query methods to the
 * GolemUI element classes only, instead of to the element prototype that the DOM shim shares
 * with every other Lit element.
 */
export function onElementRegistered(listener: (ctor: CustomElementConstructor) => void): void {
  for (const ctor of registry.tagByConstructor.keys()) {
    listener(ctor);
  }
  registry.listeners.add(listener);
}

/**
 * Returns the tag a constructor was registered with through {@link safeDefine}, or
 * undefined for a constructor that was never registered with it. Works in every
 * runtime, including registries without `customElements.getName`.
 */
export function tagNameOf(ctor: CustomElementConstructor): string | undefined {
  return registry.tagByConstructor.get(ctor);
}
