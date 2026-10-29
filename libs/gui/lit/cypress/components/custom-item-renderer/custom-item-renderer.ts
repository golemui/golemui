import type { ItemRenderContext } from '@golemui/core';
import { html } from 'lit';

/** Shows every field of the render context, so a test can read what the widget passed. */
export const customItemRenderer = (ctx: ItemRenderContext<{ name: string }>) =>
  html`<div data-cy="custom-item">
    ${`${ctx.index}|${ctx.value}|${ctx.template.name}|${ctx.selected === true}`}
  </div>`;
