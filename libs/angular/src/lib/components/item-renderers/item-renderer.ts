import { type Type } from '@angular/core';
import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core';

/**
 * The Angular-specific Core.ItemRenderer type.
 * @template T The type of the data item.
 */
export type AngularItemRenderer<T extends ItemRenderItemData> = Type<ItemRenderContext<T>>;
