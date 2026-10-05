import { tagNameOf } from './define';

/**
 * Client entry point for a server-rendered lit template (the output of `renderTemplate`).
 *
 * The server markup holds each element inert through the `defer-hydration` attribute. This
 * call removes the attribute from every held element registered through safeDefine under
 * `root`, which runs the held connectedCallback. An element whose content the server rendered
 * (marked with `data-golemui-ssr`) discards it first, so its live render replaces the server
 * markup instead of adding a second copy after it. An element whose children are the app's keeps
 * them. Lit renders before the browser paints again, so the server markup is not visible in a
 * cleared state.
 *
 * Import the elements first: an element whose definition has not loaded yet stays held. The
 * elements upgrade from the HTML, so a value the server template passed as a property (such
 * as `.options=${[...]}`) is not there: pass it as an attribute, or set the property before
 * this call. The live render generates the ids again, so give an element an id of its own when
 * something outside it points at the ids of its parts.
 *
 * @param root - Where to look for held elements (default: the whole document). An element
 * passed as `root` is resumed too.
 * @example
 * import { resumeServerRendered } from '@golemui/gui-components';
 * import '@golemui/gui-components/textinput';
 *
 * resumeServerRendered();
 */
export function resumeServerRendered(root: ParentNode = document): void {
  const held = Array.from(root.querySelectorAll('[defer-hydration]'));
  if (root instanceof Element && root.hasAttribute('defer-hydration')) {
    held.unshift(root);
  }
  // Document order: a parent is resumed before its descendants, and the descendants it
  // discarded are detached by then, so they are skipped.
  for (const element of held) {
    const ctor = customElements.get(element.localName);
    if (element.isConnected && ctor && tagNameOf(ctor) !== undefined) {
      element.removeAttribute('defer-hydration');
    }
  }
}
