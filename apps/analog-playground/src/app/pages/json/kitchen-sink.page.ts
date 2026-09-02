import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { type AngularItemRenderer } from '@golemui/angular';
import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  mockUploadService,
  onFormEvent,
} from '@golemui/apps-shared';
import {
  type FormEvent,
  type FormHealth,
  type FormSubmitEvent,
  devToolsMiddleware,
} from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import i18next from 'i18next';
import snarkdown from 'snarkdown';
import { customWidgetLoaders } from '../../custom-widget-loaders';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';
import { CustomFormHealthBoundaryComponent } from './custom-form-health-boundary.component';

const mock = kitchenSink;

const dependencies: Dependencies = {
  markdown: { parse: (md: string) => snarkdown(md) },
  uploadService: mockUploadService,
};

@Component({
  imports: [FormComponent],
  selector: 'app-json-kitchen-sink-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div>
      @if (languages.length > 0) {
        <div>
          <gui-select
            label="Choose Language"
            uid="language"
            value="en"
            [options]="languages"
            labelField="label"
            valueField="code"
            (change)="onLanguageChanged($event)"
          ></gui-select>
        </div>
      }

      <gui-form
        [config]="config"
        [autocomplete]="'off'"
        [formHealthBoundary]="customFormHealthBoundary"
        (formHealth)="onFormHealth($event)"
        (formEvent)="onFormEvent($event)"
        (formSubmit)="onFormSubmit($event)"
      ></gui-form>
    </div>
  `,
})
export default class JsonKitchenSinkPage {
  protected readonly languages = commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      code,
      label: `${flag} ${label}`,
    }));
  protected readonly customFormHealthBoundary = CustomFormHealthBoundaryComponent;
  protected readonly config: GuiFormInitConfig = {
    // Stable id: with SSR the server and client must agree on the form id.
    formName: 'analog-json-kitchen-sink',
    formDef: mock.form,
    data: mock.data,
    meta: mock.meta || {},
    dependencies,
    functions: mock.functions,
    middlewares: [devToolsMiddleware()],
    customWidgetLoaders,
    customValidators: {
      allowedNames: allowedNames,
    } as CustomValidatorSchemas,
    itemRenderers: {
      complexListItemRenderer: ComplexListItemRenderer,
      productItemRenderer: ProductItemRenderer,
      airportItemRenderer: AirportItemRenderer,
      countryItemRenderer: CountryItemRenderer,
    } as Record<string, AngularItemRenderer<any>>,
    localization: initializeI18n(mock.resources),
    validateOn: 'eager',
  };

  protected onFormHealth(formHealth: FormHealth) {
    if (formHealth.status === 'errored') {
      console.log('GolemUI form health error:', formHealth.message);
    }
  }

  protected onFormEvent(event: FormEvent) {
    if (mock.onFormEvent) {
      mock.onFormEvent(event);
    }
    onFormEvent(event);
  }

  protected onFormSubmit(event: FormSubmitEvent) {
    console.log('👉 onFormSubmit', event.data);
  }

  protected onLanguageChanged(event: Event) {
    const code = (event as CustomEvent<{ value: string }>).detail.value;
    i18next.changeLanguage(code);
  }
}
