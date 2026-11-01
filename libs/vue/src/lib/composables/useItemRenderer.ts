import { resolveItemRenderer } from '@golemui/core/internals';
import { computed, toValue, type ComputedRef, type Component, type MaybeRefOrGetter } from 'vue';
import { useVueFormContext } from '../provideFormContext';

/**
 * The item renderer the form registers under `itemRenderer`. With a `fallback`, returns the
 * fallback when there is none under that name, and warns once in dev mode.
 */
export function useItemRenderer(itemRenderer: string): ComputedRef<Component | undefined>;
export function useItemRenderer(
  itemRenderer: MaybeRefOrGetter<string | undefined>,
  fallback: Component,
): ComputedRef<Component>;
export function useItemRenderer(
  itemRenderer: MaybeRefOrGetter<string | undefined>,
  fallback?: Component,
): ComputedRef<Component | undefined> {
  const formContext = useVueFormContext();
  return computed(() => {
    const renderers = formContext.itemRenderers as Record<string, Component>;
    const name = toValue(itemRenderer);
    if (fallback) return resolveItemRenderer(renderers, name, fallback);
    return renderers[name as string];
  });
}
