// The Node side of server rendering: the element renderer for the elements registered through
// safeDefine, and the shims they need in lit's DOM shim.
import { LitElement } from 'lit';
import { LitElementRenderer } from '@lit-labs/ssr';
import {
  onElementRegistered,
  rendersIntoLightDom,
  SERVER_RENDERED_ATTRIBUTE,
  tagNameOf,
} from '../define';

type RenderInfo = Parameters<LitElementRenderer['renderShadow']>[0];

/**
 * ElementRenderer for the elements registered through safeDefine.
 *
 * It exists to keep the server event path intact, which a bubbling `context-request` follows
 * up to the form's context provider:
 *
 * - The renderer links a nested element to its host through the host's shadow root, and a
 *   light-DOM host has none, so the link falls back to the document shim and skips the host.
 *   The repair points the link at the host itself, before connectedCallback dispatches
 *   anything.
 * - It also takes the registered elements that are not LitElements (such as an element that
 *   only adds behaviour to its children). Without a renderer of their own, @lit-labs/ssr
 *   still removes an ancestor from the event path when one of them closes, so the elements
 *   after it lose the form. With this renderer they are on the path, and are not rendered.
 * - @lit-labs/ssr leaves an element that renders no shadow root on its stack of hosts, so
 *   the elements after it would take it for their host. It is removed here.
 *
 * Pass it before the default renderer:
 * `render(template, { elementRenderers: [RegisteredElementRenderer, LitElementRenderer] })`.
 */
export class RegisteredElementRenderer extends LitElementRenderer {
  static override matchesClass(ceClass: typeof HTMLElement): boolean {
    // `elementProperties` is on every ReactiveElement, LitElements included.
    return (
      tagNameOf(ceClass as CustomElementConstructor) !== undefined && 'elementProperties' in ceClass
    );
  }

  override connectedCallback(): void {
    const element = this.element as unknown as {
      __host?: { __shadowRoot?: unknown };
      __eventTargetParent?: unknown;
      __eventPathCache?: unknown;
    };
    if (element.__host && !element.__host.__shadowRoot) {
      element.__eventTargetParent = element.__host;
      element.__eventPathCache = undefined;
    }
    super.connectedCallback();
    // Marks the content as server markup, which the element discards on its first client
    // render (see SERVER_RENDERED_ATTRIBUTE). Elements with a shadow root render nothing here.
    if (rendersIntoLightDom(this.element.constructor as CustomElementConstructor)) {
      this.element.setAttribute(SERVER_RENDERED_ATTRIBUTE, '');
    }
  }

  override renderShadow(renderInfo: RenderInfo): ReturnType<LitElementRenderer['renderShadow']> {
    const shadow = super.renderShadow(renderInfo);
    // @lit-labs/ssr pushed this element on its host stack before the call, and pops it only
    // after a shadow root it rendered.
    if (shadow === undefined) {
      renderInfo.customElementHostStack.pop();
    }
    return shadow;
  }
}

let supportInstalled = false;

/**
 * Prepares the Node environment for rendering the elements registered through safeDefine.
 * Idempotent, and called by every render function, so calling it directly is only needed
 * when calling @lit-labs/ssr's `render` yourself.
 *
 * It extends the DOM shim element (the shim only implements attributes) with a
 * `classList` accessor, because the elements set host classes in connectedCallback. That
 * prototype is shared with every other Lit element rendered in the same Node process, so
 * the accessor is process-wide. It adds a missing member, so it changes no existing
 * behavior.
 *
 * It also defines `querySelector` and `querySelectorAll` that find nothing, because the
 * elements read their own children through `@query` accessors in willUpdate and render,
 * and the shim has no children to query. Finding nothing is what the first client render
 * sees too, so the widgets already take that branch. Both methods are defined on the
 * safeDefine-registered classes only, including the classes registered after this call.
 * Any other Lit element in the process keeps the shim behavior, which is a TypeError.
 * That reports the failed query instead of rendering incomplete markup with no error.
 *
 * It also registers a render option so every safeDefine-registered element runs
 * connectedCallback on the server. That call is what attaches the form context and
 * creates the store subscriptions, and without it the widgets render empty. A registered
 * element with a shadow root, or one that is not a LitElement, is not rendered at all: its tag
 * and its light children are, and the browser renders the element as usual.
 */
export function installLitSsrSupport(): void {
  if (supportInstalled) {
    return;
  }
  supportInstalled = true;
  installClassListShim(LitElement.prototype);
  onElementRegistered((ctor) => {
    installQueryMethods(ctor);
    // Again from each element: a bundler can give the elements a copy of lit other than this
    // module's (Next.js compiles instrumentation.ts on its own), with its own DOM shim.
    installClassListShim(ctor.prototype);
  });
  LitElementRenderer.renderOptions.push((element) => {
    const ctor = element.constructor as CustomElementConstructor;
    if (!tagNameOf(ctor)) {
      return undefined;
    }
    return rendersIntoLightDom(ctor) ? { connectedCallback: true } : { disableSsr: true };
  });
}

// Defines the two query methods on one registered element class. The `in` check skips a
// real DOM, and skips a class that inherits the methods from a registered base class.
function installQueryMethods(ctor: CustomElementConstructor): void {
  const prototype = ctor.prototype as object;
  if (!('querySelector' in prototype)) {
    Object.defineProperty(prototype, 'querySelector', {
      configurable: true,
      writable: true,
      value: () => null,
    });
  }
  if (!('querySelectorAll' in prototype)) {
    Object.defineProperty(prototype, 'querySelectorAll', {
      configurable: true,
      writable: true,
      value: () => [],
    });
  }
  // @lit-labs/ssr links a nested element to its host through getRootNode, which lit's DOM shim
  // has. When another DOM's HTMLElement was global as lit loaded (Analog's server imports
  // @angular/platform-server/init first), the elements extend that one, which may not have it.
  // Without a root the renderer falls back to the host, which RegisteredElementRenderer wants.
  if (!('getRootNode' in prototype)) {
    Object.defineProperty(prototype, 'getRootNode', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  }
}

function installClassListShim(start: object): void {
  // Find the prototype that owns setAttribute: in Node with lit loaded that is the
  // @lit-labs/ssr-dom-shim element prototype. Reached through an element class, which extends
  // the shim's HTMLElement, so this module never imports the shim package itself.
  let proto: object | null = start;
  while (proto && proto !== Object.prototype) {
    if (Object.getOwnPropertyDescriptor(proto, 'setAttribute')) {
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  if (!proto || proto === Object.prototype) {
    return;
  }
  // A real DOM (Element.prototype owns setAttribute) already has classList, and a second
  // evaluation of this module finds the accessor it installed.
  if ('classList' in proto) {
    return;
  }
  Object.defineProperty(proto, 'classList', {
    configurable: true,
    get(this: Element) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const element = this;
      const read = () =>
        new Set<string>(
          String(element.getAttribute('class') ?? '')
            .split(/\s+/)
            .filter(Boolean),
        );
      const write = (names: Set<string>) => {
        element.setAttribute('class', [...names].join(' '));
      };
      return {
        add: (...names: string[]) => {
          const current = read();
          for (const name of names) {
            current.add(name);
          }
          write(current);
        },
        remove: (...names: string[]) => {
          const current = read();
          for (const name of names) {
            current.delete(name);
          }
          write(current);
        },
        toggle: (name: string, force?: boolean) => {
          const current = read();
          const shouldAdd = force ?? !current.has(name);
          if (shouldAdd) {
            current.add(name);
          } else {
            current.delete(name);
          }
          write(current);
          return shouldAdd;
        },
        contains: (name: string) => read().has(name),
      };
    },
  });
}
