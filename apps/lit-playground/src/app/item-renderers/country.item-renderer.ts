import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ItemRenderContext } from '@golemui/core';

type CountryItem = {
  id: string;
  label: string;
  flag: string;
};

export const countryItemRenderer = (ctx: ItemRenderContext<CountryItem>): TemplateResult => {
  const classes = {
    'product-renderer': true,
    disabled: !!ctx.disabled,
    selected: !!ctx.selected,
    focused: !!ctx.focused,
    odd: ctx.index % 2 !== 0,
  };

  return html`
    <div class=${classMap(classes)}>
      <span>${ctx.template.label}</span>
      <span>${ctx.template.flag}</span>
    </div>
  `;
};
