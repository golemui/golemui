/**
 * Helpers for the attributes an element writes on the markup it enhances: the app's own elements
 * (a tab, a menu item, a tooltip's target), where what the app wrote must stay.
 */

let nextId = 0;

/** Gives an element an id unless it has one, `gui-<part>-<n>`, and returns it. */
export function ensureId(element: Element, part: string): string {
  if (!element.id) element.id = `gui-${part}-${++nextId}`;
  return element.id;
}

/** Sets an attribute the element has none of: a value the app wrote stays. */
export function setIfMissing(element: Element, name: string, value: string): void {
  if (!element.hasAttribute(name)) element.setAttribute(name, value);
}

/**
 * Sets an attribute, or removes it for `null`, leaving it alone when it already matches: no
 * mutation, so no MutationObserver hears it.
 */
export function syncAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}
