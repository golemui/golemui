import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ItemRenderContext } from '@golemui/core';
import { AirportItem } from '@golemui/apps-shared';

export const airportItemRenderer = (ctx: ItemRenderContext<AirportItem>): TemplateResult => {
  const classes = {
    'airport-renderer': true,
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
      <div>
        <p>${ctx.template.name}</p>
      </div>
      <div>
        <h2>${ctx.template.iata}</h2>
      </div>
    </div>
  `;
};
