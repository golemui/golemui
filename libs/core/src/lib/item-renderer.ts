export type ItemRenderItemData = string | Record<string, unknown>;

/**
 * The ItemRenderer Data Contract
 */
export interface ItemRenderContext<T extends ItemRenderItemData> {
  template: T;
  /**
   * @see OptionValue
   */
  value: string | number;
  index: number;
  selected?: boolean;
  disabled?: boolean;
  focused?: boolean;
}

export type ItemRendererFn<T extends ItemRenderItemData = ItemRenderItemData, R = unknown> = (
  context: ItemRenderContext<T>,
) => R;

export type ItemRendererClass<R = unknown> = R;

/**
 * The Universal item renderer type.
 * @template T The type of the data item.
 * @template R The framework-specific return type.
 * R can be React's React.FC, Lit's TemplateResult or Angular's Type<?>)
 */
export type ItemRenderer<T extends ItemRenderItemData = ItemRenderItemData, R = unknown> =
  | ItemRendererFn<T, R>
  | ItemRendererClass<R>;
