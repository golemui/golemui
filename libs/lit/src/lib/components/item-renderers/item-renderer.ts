import * as Core from '@golemui/core';
import { TemplateResult } from 'lit';

/**
 * The Lit-specific Core.ItemRenderer type.
 * @template T The type of the data item.
 */
export type LitItemRenderer<T extends Core.ItemRenderItemData> = (
  ctx: Core.ItemRenderContext<T>,
) => TemplateResult;
