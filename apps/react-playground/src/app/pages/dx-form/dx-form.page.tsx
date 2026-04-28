import * as AppsShared from '@golemui/apps-shared';
import { FormComponent } from '@golemui/gui-react';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from '../../item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from '../../item-renderers/ComplexListItemRenderer';
import { CountryItemRenderer } from '../../item-renderers/CountryItemRenderer';
import { ProductItemRenderer } from '../../item-renderers/ProductItemRenderer';

const ks = AppsShared.buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
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
});

export function DxFormPage() {
  return (
    <div>
      <FormComponent
        formDef={ks.formDef}
        data={ks.data}
        formSelectors={ks.formSelectors}
        formConfig={ks.formConfig}
      />
    </div>
  );
}

export default DxFormPage;
