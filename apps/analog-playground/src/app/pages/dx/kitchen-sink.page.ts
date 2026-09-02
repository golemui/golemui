import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import {
  buildKitchenSinkDx,
  initializeI18n,
  mockUploadService,
  onFormEvent,
} from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';
import { customWidgetLoaders } from '../../custom-widget-loaders';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';
import { RendererExampleComponent } from '../../renderer-example/renderer-example.component';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  // The same module-scope loaders that main.ts / main.server.ts preload, so the widget
  // registry finds the heading widget already loaded on both sides.
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
  imports: [FormComponent],
  selector: 'app-dx-kitchen-sink-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div>
      @if (errors().length) {
        <div style="border: 2px solid red; padding: 8px 12px; margin-bottom: 12px; color: red">
          <ul style="margin: 0; padding-left: 20px">
            @for (error of errors(); track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }
      <gui-form
        [config]="config"
        (formEvent)="onFormEvent($event)"
        (formHealth)="onFormHealth($event)"
        (formSubmit)="onFormSubmit($event)"
      ></gui-form>
    </div>
  `,
})
export default class DxKitchenSinkPage {
  protected readonly config: GuiFormInitConfig = {
    // Stable id: with SSR the server and client must agree on the form id.
    formName: 'analog-dx-kitchen-sink',
    formDef: ks.formDef,
    data: ks.data,
    formSelectors: ks.formSelectors,
    formConfig: ks.formConfig,
    customValidators: ks.customValidators,
    localization,
  };
  protected readonly errors = signal<string[]>([]);

  protected onFormEvent(event: FormEvent) {
    onFormEvent(event);
  }

  protected onFormSubmit(event: FormSubmitEvent) {
    console.log('👉 onFormSubmit', event.data);
  }

  protected onFormHealth(event: FormHealth) {
    if (event.status === 'errored') {
      this.errors.set([...this.errors(), event.message]);
    }
  }
}
