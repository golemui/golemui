'use client';

import {
  buildKitchenSinkDx,
  initializeI18n,
  mockUploadService,
  onFormEvent,
} from '@golemui/apps-shared';
import type { FormHealth } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { useCallback, useState } from 'react';
import snarkdown from 'snarkdown';
import { customWidgetLoaders } from '../../../components/custom-widget-loaders';
import { AirportItemRenderer } from '../../../components/item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from '../../../components/item-renderers/ComplexListItemRenderer';
import { CountryItemRenderer } from '../../../components/item-renderers/CountryItemRenderer';
import { ProductItemRenderer } from '../../../components/item-renderers/ProductItemRenderer';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  // Shared module-scope loaders: identical references to the ones preloaded in
  // GolemuiProvider, so the registry cache hits.
  widgetLoaders: customWidgetLoaders,
  itemRenderers: {
    complexListItemRenderer: ComplexListItemRenderer,
    productItemRenderer: ProductItemRenderer,
    airportItemRenderer: AirportItemRenderer,
    countryItemRenderer: CountryItemRenderer,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
    uploadService: mockUploadService,
  },
  // React-flavored Renderer example — the `render` function is called with the
  // form API and returns a ReactNode (JSX).
  rendererExample: (api: any) => (
    <h1>Client name: {api?.$form?.rendererClientName || 'unknown'}</h1>
  ),
});

const config = {
  // Stable id: with SSR the server and client must agree on the form id.
  formName: 'nextjs-dx-kitchen-sink',
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization,
};

export default function KitchenSinkDxPage() {
  const [errors, setErrors] = useState<string[]>([]);

  const onFormHealth = useCallback((event: FormHealth) => {
    if (event.status === 'errored') {
      setErrors((prev) => [...prev, event.message]);
    }
  }, []);

  return (
    <div>
      {errors.length > 0 && (
        <div
          style={{
            border: '2px solid red',
            padding: '8px 12px',
            marginBottom: '12px',
            color: 'red',
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <GuiForm config={config} formEvent={onFormEvent} formHealth={onFormHealth} />
    </div>
  );
}
