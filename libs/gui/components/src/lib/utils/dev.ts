declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether the app runs a development build. The app's bundler replaces `process.env.NODE_ENV`;
 * without one there is no way to tell, so development warnings stay off.
 */
const devMode = (() => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

const warned = new WeakSet<Element>();

/**
 * Warns once, in development, when a field has no label to take its accessible name from. The
 * field gets no made-up name instead, so accessibility checkers such as axe flag it too.
 *
 * @param host - The field element.
 * @param labelId - The id of the element that labels the field; it may belong to a host picker.
 */
export function warnIfUnlabelled(host: HTMLElement, labelId: string): void {
  if (!devMode || warned.has(host)) return;
  const root = host.getRootNode() as Document | ShadowRoot;
  if (root.getElementById?.(labelId)) return;

  warned.add(host);
  console.warn(
    `<${host.localName}> has no label, so it has no accessible name. Set its label attribute.`,
    host,
  );
}

const warnings = new WeakMap<Element, Set<string>>();

/**
 * Warns once per element and message, in development, about markup the app has to write and did
 * not, such as the `[popover]` child of a `gui-popover`. The element then does without it.
 */
export function warnInDevelopment(host: HTMLElement, message: string): void {
  if (!devMode) return;
  const seen = warnings.get(host) ?? new Set<string>();
  if (seen.has(message)) return;
  seen.add(message);
  warnings.set(host, seen);
  console.warn(`<${host.localName}> ${message}`, host);
}
