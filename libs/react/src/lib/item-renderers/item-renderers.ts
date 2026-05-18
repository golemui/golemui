import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core'

export type ReactItemRenderer<T extends ItemRenderItemData> = React.ComponentType<
  ItemRenderContext<T>
>;
