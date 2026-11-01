import { resolveItemRenderer } from '@golemui/core/internals';
import { useReactFormContext } from '../ReactFormContext';
import { useMemo } from 'react';

/**
 * The item renderer the form registers under `itemRenderer`. With a `fallback`, returns the
 * fallback when there is none under that name, and warns once in dev mode.
 */
export function useItemRenderer(itemRenderer: string): React.ComponentType;
export function useItemRenderer<Props>(
  itemRenderer: string | undefined,
  fallback: React.ComponentType<Props>,
): React.ComponentType<Props>;
export function useItemRenderer(
  itemRenderer: string | undefined,
  fallback?: React.ComponentType<any>,
) {
  const { formContext } = useReactFormContext();

  const Renderer = useMemo(() => {
    const renderers = formContext.itemRenderers as Record<string, React.ComponentType>;

    if (fallback) return resolveItemRenderer(renderers, itemRenderer, fallback);
    return renderers[itemRenderer as string];
  }, [itemRenderer, fallback, formContext.itemRenderers]);

  return Renderer;
}
