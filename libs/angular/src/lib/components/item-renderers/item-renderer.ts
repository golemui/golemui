import { Type } from '@angular/core';
import * as Core from '@golemui/core';

/**
 * The Angular-specific Core.ItemRenderer type.
 * @template T The type of the data item.
 */
export type AngularItemRenderer<T extends Core.ItemRenderItemData> = Type<
  Core.ItemRenderContext<T>
>;
