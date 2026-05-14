import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as GuiAngular from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';

const localization = AppsShared.initializeI18n({});

const ks = AppsShared.buildKitchenSinkDx({
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
});

@Component({
  imports: [CommonModule, GuiAngular.FormComponent],
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
    localization,
  };

  protected onFormEvent(event: Core.FormEvent) {
    AppsShared.onFormEvent(event);
  }
}
