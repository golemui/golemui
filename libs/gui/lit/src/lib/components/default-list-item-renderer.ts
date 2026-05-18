import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { type ItemRenderContext } from '@golemui/core';

export const defaultListItemRenderer = (ctx: ItemRenderContext<any>) => {
  const classes = {
    'gui-list__item': true,
    'gui-list__item-selected': !!ctx.selected,
    'gui-list__item-focused': !!ctx.focused,
    'gui-list__item-disabled': !!ctx.disabled,
  };

  return html`
    <div
      role="option"
      class=${classMap(classes)}
      aria-selected=${ctx.selected ? 'true' : 'false'}
      aria-disabled=${ctx.disabled ? 'true' : 'false'}
    >
      ${ctx.template}
    </div>
  `;
};
