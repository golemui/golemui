import { useReactFormContext } from '../ReactFormContext';
import { useMemo } from 'react';

export function useItemRenderer(itemRenderer: string) {
  const { formContext } = useReactFormContext();

  const Renderer = useMemo(() => {
    const renderers = formContext.itemRenderers as Record<string, React.ComponentType>;

    return renderers[itemRenderer];
  }, [itemRenderer, formContext.itemRenderers]);

  return Renderer;
}
