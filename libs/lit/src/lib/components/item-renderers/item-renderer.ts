import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core'
import { type TemplateResult } from 'lit';

/**
 * The Lit-specific Core.ItemRenderer type.
 * @template T The type of the data item.
 */
export type LitItemRenderer<T extends ItemRenderItemData> = (
  ctx: ItemRenderContext<T>,
) => TemplateResult;
