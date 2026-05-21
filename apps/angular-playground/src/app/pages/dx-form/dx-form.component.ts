import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { buildKitchenSinkDx, initializeI18n, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';
import { RendererExampleComponent } from '../../renderer-example/renderer-example.component';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.component')).HeadingComponent,
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
  // Angular-flavored Renderer example — returns `{ component, api }`. The
  // engine calls this fn on every form-data change with the live form API and
  // we forward it through as `api`; Angular's RendererComponent passes it as
  // an Input to the dynamic component.
  rendererExample: (api: any) => ({
    component: RendererExampleComponent,
    api,
  }),
});

@Component({
  imports: [CommonModule, FormComponent],
  selector: 'app-dx-form-page',
  templateUrl: './dx-form.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DxFormPage {
  protected config: GuiFormInitConfig = {
    formDef: ks.formDef,
    data: ks.data,
    formSelectors: ks.formSelectors,
    formConfig: ks.formConfig,
    customValidators: ks.customValidators,
    localization,
  };

  protected onFormEvent(event: FormEvent) {
    onFormEvent(event);
  }
}
