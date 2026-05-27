import type { InputSignal, InputSignalWithTransform, Type } from '@angular/core';
import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core';

type SignalOrValue<T> = T | InputSignal<T> | InputSignalWithTransform<T, any>;

type AngularItemRendererInputs<T extends ItemRenderItemData> = {
  [K in keyof ItemRenderContext<T>]: SignalOrValue<ItemRenderContext<T>[K]>;
};

/**
 * The author-facing contract for signal-based Angular item renderers.
 * Declare a renderer class with `implements AngularItemRenderContext<T>` so the
 * TypeScript compiler enforces the full set of inputs (`template`, `value`,
 * `index`, `selected`, `disabled`, `focused`) and their signal types.
 *
 * For `@Input()`-decorator renderers, keep using `ItemRenderContext<T>` from
 * `@golemui/core` — its plain-value fields match decorator-typed properties.
 *
 * @template T The type of the data item.
 */
export interface AngularItemRenderContext<T extends ItemRenderItemData> {
  template: InputSignal<T>;
  value: InputSignal<string | number>;
  index: InputSignal<number>;
  selected: InputSignal<boolean | undefined>;
  disabled: InputSignal<boolean | undefined>;
  focused: InputSignal<boolean | undefined>;
}

/**
 * The Angular-specific Core.ItemRenderer type.
 * Accepts components declared with either `@Input()` or signal `input()`.
 * @template T The type of the data item.
 */
export type AngularItemRenderer<T extends ItemRenderItemData> = Type<AngularItemRendererInputs<T>>;
