import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { type ItemRenderContext } from '@golemui/core';

type CountryItem = {
  id: string;
  label: string;
  flag: string;
};

export const countryItemRenderer = (ctx: ItemRenderContext<CountryItem>): TemplateResult => {
  const classes = {
    'country-renderer': true,
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
