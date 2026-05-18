import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { type ItemRenderContext } from '@golemui/core';

type CarItem = {
  id: string;
  label: string;
  img: string;
  price: number;
};

export const carItemRenderer = (ctx: ItemRenderContext<CarItem>): TemplateResult => {
  const classes = {
    'car-renderer': true,
    disabled: !!ctx.disabled,
    selected: !!ctx.selected,
    focused: !!ctx.focused,
    odd: ctx.index % 2 !== 0,
  };

  return html`
    <div class=${classMap(classes)}>
      <span class="car-renderer__img">${ctx.template.img}</span>
      <span class="car-renderer__label">${ctx.template.label}</span>
      <span class="car-renderer__price">$${ctx.template.price}/day</span>
    </div>
  `;
};
