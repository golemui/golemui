import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ItemRenderContext } from '@golemui/core';

type ProductItem = {
  product: string;
  description: string;
  price: number;
};

export const productItemRenderer = (ctx: ItemRenderContext<ProductItem>): TemplateResult => {
  const classes = {
    'product-renderer': true,
    disabled: !!ctx.disabled,
    selected: !!ctx.selected,
    focused: !!ctx.focused,
    odd: ctx.index % 2 !== 0,
  };

  return html`
    <div class=${classMap(classes)}>
      <div>
        <h2>${ctx.template.product}</h2>
        <p>${ctx.template.description}</p>
      </div>
      <div>
        <p>${ctx.template.price}</p>
      </div>
    </div>
  `;
};
