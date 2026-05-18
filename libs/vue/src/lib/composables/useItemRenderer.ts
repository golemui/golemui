import { computed, type ComputedRef, type Component } from 'vue';
import { useVueFormContext } from '../provideFormContext';

export function useItemRenderer(itemRenderer: string): ComputedRef<Component | undefined> {
  const formContext = useVueFormContext();
  return computed(() => {
    const renderers = formContext.itemRenderers as Record<string, Component>;
    return renderers[itemRenderer];
  });
}
