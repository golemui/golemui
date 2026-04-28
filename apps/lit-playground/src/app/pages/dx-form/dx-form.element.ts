import * as AppsShared from '@golemui/apps-shared';
import '@golemui/gui-lit';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';

const ks = AppsShared.buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
  },
  itemRenderers: {
    complexListItemRenderer,
    productItemRenderer,
    airportItemRenderer,
    countryItemRenderer,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  },
});

@customElement('lit-dx-form')
export class DxFormElement extends LitElement {
  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <div>
        <gui-form
          .formDef=${ks.formDef}
          .data=${ks.data}
          .formSelectors=${ks.formSelectors}
          .formConfig=${ks.formConfig}
        ></gui-form>
      </div>
    `;
  }
}
