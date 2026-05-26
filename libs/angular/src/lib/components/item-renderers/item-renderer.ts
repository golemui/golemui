import type { InputSignal, InputSignalWithTransform, Type } from '@angular/core';
import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core';

type SignalOrValue<T> = T | InputSignal<T> | InputSignalWithTransform<T, any>;

type AngularItemRenderContext<T extends ItemRenderItemData> = {
  [K in keyof ItemRenderContext<T>]: SignalOrValue<ItemRenderContext<T>[K]>;
};

/**
 * The Angular-specific Core.ItemRenderer type.
 * Accepts components declared with either `@Input()` or signal `input()`.
 * @template T The type of the data item.
 */
export type AngularItemRenderer<T extends ItemRenderItemData> = Type<AngularItemRenderContext<T>>;
