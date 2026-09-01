/**
 * Server-only entry point (@golemui/lit/ssr). It calls @lit-labs/ssr, which is an
 * optional peer dependency: install it in the project that server-renders. Importing
 * this module in a browser bundle is unsupported.
 */
import type { FormInitConfig, ValidatorFn, WithWidget } from '@golemui/core';
import { html } from 'lit';
import { LitElementRenderer, render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { FormElement } from '../components/form/form.element';
import { tagNameOf } from '../utils/define';
import type { Type } from '../utils/type';

/**
 * ElementRenderer for the GolemUI elements (everything registered through safeDefine).
 *
 * It exists to repair the server event path for light DOM: the renderer links a nested
 * element to its host through the host's shadow root, and a light-DOM host has none,
 * so the link falls back to the document shim and skips the host. A bubbling
 * `context-request` then never reaches the form's context provider. The repair points
 * the link at the host itself, before connectedCallback dispatches anything.
 *
 * Pass it before the default renderer:
 * `render(template, { elementRenderers: [GuiSsrElementRenderer, LitElementRenderer] })`.
 */
export class GuiSsrElementRenderer extends LitElementRenderer {
  static override matchesClass(ceClass: typeof HTMLElement): boolean {
    return (
      tagNameOf(ceClass as CustomElementConstructor) !== undefined && super.matchesClass(ceClass)
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
  }
}

let supportInstalled = false;

/**
 * Prepares the Node environment for rendering GolemUI elements. Idempotent, and called
 * by {@link renderGuiHtml} and {@link renderGuiFormHtml}, so calling it directly is
 * only needed when calling @lit-labs/ssr's `render` yourself.
 *
 * It extends the DOM shim element (the shim only implements attributes) with a
 * `classList` accessor, because the elements set host classes in connectedCallback, and
 * with `querySelector`/`querySelectorAll` that find nothing, because the elements read
 * their own children through `@query` accessors in willUpdate and render, and the shim
 * has no children to query. Finding nothing is what the first client render sees too, so
 * the widgets already take that branch. It also registers a render option so every
 * safeDefine-registered element runs connectedCallback on the server. That call is what
 * attaches the form context and creates the store subscriptions, and without it the
 * widgets render empty.
 */
export function installLitSsrSupport(): void {
  if (supportInstalled) {
    return;
  }
  supportInstalled = true;
  installElementShim();
  LitElementRenderer.renderOptions.push((element) =>
    tagNameOf(element.constructor as CustomElementConstructor)
      ? { connectedCallback: true }
      : undefined,
  );
}

function installElementShim(): void {
  // Find the prototype that owns setAttribute: in Node with lit loaded that is the
  // @lit-labs/ssr-dom-shim element prototype. Reached through a registered element so
  // this module never imports the shim package itself.
  let proto: object | null = FormElement.prototype;
  while (proto && proto !== Object.prototype) {
    if (Object.getOwnPropertyDescriptor(proto, 'setAttribute')) {
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  if (!proto || proto === Object.prototype) {
    return;
  }
  // Each member is checked on its own: a real DOM (Element.prototype owns setAttribute)
  // has all of them, and a second evaluation of this module finds the ones it installed.
  if (!('querySelector' in proto)) {
    Object.defineProperty(proto, 'querySelector', {
      configurable: true,
      writable: true,
      value: () => null,
    });
  }
  if (!('querySelectorAll' in proto)) {
    Object.defineProperty(proto, 'querySelectorAll', {
      configurable: true,
      writable: true,
      value: () => [],
    });
  }
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

/**
 * Removes the declarative shadow root wrappers from server output. Every GolemUI
 * element renders into light DOM, but @lit-labs/ssr wraps each element's output in a
 * `<template shadowroot>` anyway, where global stylesheets do not apply and where
 * jsdom does not parse it into children. Removing the wrappers restores the light-DOM
 * tree the client renders. Non-shadow-root `<template>` elements are kept.
 */
export function stripShadowRootTemplates(markup: string): string {
  const token = /<template[^>]*>|<\/template>/g;
  const isShadowRootOpen = (tag: string) =>
    tag.startsWith('<template') && tag.includes('shadowroot');
  let output = '';
  let last = 0;
  // true = shadow root wrapper (removed), false = real template (kept)
  const stack: boolean[] = [];
  for (let match = token.exec(markup); match; match = token.exec(markup)) {
    output += markup.slice(last, match.index);
    last = match.index + match[0].length;
    if (match[0] === '</template>') {
      if (stack.pop() === false) {
        output += match[0];
      }
    } else if (isShadowRootOpen(match[0])) {
      stack.push(true);
    } else {
      stack.push(false);
      output += match[0];
    }
  }
  output += markup.slice(last);
  return output;
}

/** Removes the lit hydration marker comments. The resume entry point does not read them. */
function stripHydrationMarkers(markup: string): string {
  return markup
    .replace(/<!--\/?lit-part[^>]*-->/g, '')
    .replace(/<!--lit-node \d+-->/g, '')
    .replace(/<\?>/g, '');
}

/**
 * Renders a lit template containing GolemUI elements to an HTML string in plain Node.
 *
 * The output is complete light-DOM markup: shadow root wrappers are removed and every
 * GolemUI element has the `defer-hydration` attribute, so on the client the
 * elements stay inert until a resume entry point removes the attribute.
 *
 * @param template - A lit `html` template. Widgets must be preloaded first.
 * @param options - `keepMarkers` keeps the lit hydration marker comments (default false).
 * @returns The rendered markup.
 */
export async function renderGuiHtml(
  template: unknown,
  options?: { keepMarkers?: boolean },
): Promise<string> {
  installLitSsrSupport();
  const result = render(template, {
    deferHydration: true,
    elementRenderers: [GuiSsrElementRenderer, LitElementRenderer],
  });
  const markup = stripShadowRootTemplates(await collectResult(result));
  return options?.keepMarkers ? markup : stripHydrationMarkers(markup);
}

/**
 * Renders one GolemUI form to an HTML string in plain Node.
 *
 * @param options - The form inputs. `config` must contain an explicit `formName`, and
 * the widgets in `config.widgetLoaders` must already be preloaded with
 * `preloadFormWidgets` so the render can read them synchronously.
 * @returns The rendered markup: a `<gui-core-form>` element holding the complete form.
 * @example
 * await preloadFormWidgets({ widgetLoaders });
 * const markup = await renderGuiFormHtml({ config, validators });
 */
export async function renderGuiFormHtml(options: {
  config: FormInitConfig<Type<WithWidget>>;
  validators: ValidatorFn<any>;
  autocomplete?: string;
  keepMarkers?: boolean;
}): Promise<string> {
  if (!options.config.formName) {
    throw new Error(
      'Server rendering needs an explicit formName in the form config, ' +
        'so the server and the client produce the same markup.',
    );
  }
  return renderGuiHtml(
    html`<gui-core-form
      .config=${options.config}
      .validators=${options.validators}
      .autocomplete=${options.autocomplete}
    ></gui-core-form>`,
    { keepMarkers: options.keepMarkers },
  );
}
