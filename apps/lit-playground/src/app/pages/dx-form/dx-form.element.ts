import { buildKitchenSinkDx, initializeI18n, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';

const ks = buildKitchenSinkDx({
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
  // Lit-flavored Renderer example — the `render` function is called with the
  // form API and returns a Lit `TemplateResult`.
  rendererExample: (api: any) =>
    html`<h1>Client name: ${api?.$form?.rendererClientName || 'unknown'}</h1>`,
});

const config: GuiFormInitConfig = {
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization: initializeI18n({}),
};

@customElement('lit-dx-form')
export class DxFormElement extends LitElement {
  override createRenderRoot() {
    return this;
  }

  protected async onFormEvent(event: CustomEvent<FormEvent>) {
    await onFormEvent(event.detail);
  }

  override render() {
    return html`
      <div>
        <gui-form .config=${config} @formEvent=${this.onFormEvent}></gui-form>
      </div>
    `;
  }
}
