import { buildKitchenSinkDx, initializeI18n, mockUploadService } from '@golemui/apps-shared';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { html } from 'lit';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../item-renderers/country.item-renderer';
import { productItemRenderer } from '../item-renderers/product.item-renderer';
import { customWidgetLoaders } from '../lib/custom-widget-loaders';

// Shared by the server render (page frontmatter) and the client resume (page script), so
// both sides build the form from the same definition. Nothing here touches the DOM.
const ks = buildKitchenSinkDx({
  // Shared module-scope loaders: identical references to the ones preloaded on both sides,
  // so the registry cache hits.
  widgetLoaders: customWidgetLoaders,
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
    uploadService: mockUploadService,
  },
  // Lit-flavored Renderer example — the `render` function is called with the
  // form API and returns a Lit `TemplateResult`.
  rendererExample: (api: any) =>
    html`<h1>Client name: ${api?.$form?.rendererClientName || 'unknown'}</h1>`,
});

export const config: GuiFormInitConfig = {
  // Stable id: the server and the client must agree on the form id.
  formName: 'astro-dx-kitchen-sink',
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization: initializeI18n({}),
};
