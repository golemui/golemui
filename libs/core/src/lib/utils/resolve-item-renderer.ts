import { isDevMode } from './dev-mode';

const NO_RENDERERS = {};
const warned = new WeakMap<object, Set<string>>();

/**
 * The item renderer an input names, or the widget's default renderer when it names none or one
 * the form does not register. Several apps can share a form, and one of them may not register
 * every renderer it names: its items still render, with their `labelField`.
 *
 * A missing renderer warns once in dev mode, with the renderers the form registers.
 *
 * @param itemRenderers - The `itemRenderers` of the form config.
 * @param name - The `itemRenderer` the input names.
 * @param defaultRenderer - The widget's own renderer.
 * @returns The registered renderer, or `defaultRenderer`.
 */
export function resolveItemRenderer<Renderer>(
  itemRenderers: Record<string, Renderer> | undefined,
  name: string | undefined,
  defaultRenderer: Renderer,
): Renderer {
  if (!name) return defaultRenderer;
  const renderer = itemRenderers?.[name];
  if (renderer) return renderer;
  if (isDevMode()) warnOnce(itemRenderers ?? NO_RENDERERS, name);
  return defaultRenderer;
}

function warnOnce(itemRenderers: object, name: string) {
  const names = warned.get(itemRenderers) ?? new Set<string>();
  if (names.has(name)) return;
  names.add(name);
  warned.set(itemRenderers, names);
  const registered = Object.keys(itemRenderers).map((key) => `"${key}"`);
  console.warn(
    `[GolemUI] No item renderer "${name}" is registered, so its items render with the default ` +
      `renderer. Registered item renderers: ${registered.join(', ') || '(none)'}.`,
  );
}
