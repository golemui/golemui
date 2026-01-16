import * as Core from '@golemui/core';

export type ReactItemRenderer<T extends Core.ItemRenderItemData> = React.ComponentType<
  Core.ItemRenderContext<T>
>;
