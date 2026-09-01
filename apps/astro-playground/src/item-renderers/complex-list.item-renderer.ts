import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { type ItemRenderContext } from '@golemui/core';

type ComplexItem = {
  title: string;
  description: string;
};

export const complexListItemRenderer = (ctx: ItemRenderContext<ComplexItem>): TemplateResult => {
  const classes = {
    'my-custom-class': true,
    disabled: !!ctx.disabled,
    selected: !!ctx.selected,
    focused: !!ctx.focused,
    odd: ctx.index % 2 !== 0,
  };

  return html`
    <div class=${classMap(classes)}>
      <h2>${ctx.template.title}</h2>
      <p>${ctx.template.description}</p>
    </div>
  `;
};
