import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ItemRenderContext } from '@golemui/core';

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
    <div
      role="option"
      class=${classMap(classes)}
      aria-selected=${ctx.selected ? 'true' : 'false'}
      aria-disabled=${ctx.disabled ? 'true' : 'false'}
    >
      <h2>${ctx.template.title}</h2>
      <p>${ctx.template.description}</p>
    </div>
  `;
};
