import { buildKitchenSinkDx, initializeI18n, onFormEvent } from '@golemui/apps-shared';
import type { FormHealth } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { useCallback, useState } from 'react';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from './item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from './item-renderers/ComplexListItemRenderer';
import { CountryItemRenderer } from './item-renderers/CountryItemRenderer';
import { ProductItemRenderer } from './item-renderers/ProductItemRenderer';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('./custom-fields/heading/heading.component')).HeadingComponent,
  },
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
  },
  rendererExample: (api: any) => (
    <h1>Client name: {api?.$form?.rendererClientName || 'unknown'}</h1>
  ),
});

const config = {
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization,
};

export function DxFormPage() {
  const [errors, setErrors] = useState<string[]>([]);

  const onFormHealth = useCallback((event: FormHealth) => {
    if (event.status === 'errored') {
      setErrors((prev) => [...prev, event.message]);
    }
  }, []);

  return (
    <div>
      {errors.length > 0 && (
        <div className="rob-errors">
          <ul>
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
