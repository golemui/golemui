import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { type ItemRenderContext } from '@golemui/core';
import { type AirportItem } from '@golemui/apps-shared';

export const airportItemRenderer = (ctx: ItemRenderContext<AirportItem>): TemplateResult => {
  const classes = {
    'airport-renderer': true,
    disabled: !!ctx.disabled,
    selected: !!ctx.selected,
    focused: !!ctx.focused,
    odd: ctx.index % 2 !== 0,
  };

  return html`
    <div class=${classMap(classes)}>
      <div>
        <p>${ctx.template.name}</p>
      </div>
      <div>
        <h2>${ctx.template.iata}</h2>
      </div>
    </div>
  `;
};
