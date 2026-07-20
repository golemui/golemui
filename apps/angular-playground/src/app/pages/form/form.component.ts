import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { type AngularItemRenderer } from '@golemui/angular';
import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
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
import { APP_CONFIG } from '../../../environments/environment.model';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';
import { CustomFormHealthBoundaryComponent } from './custom-form-health-boundary.component';

const mock = kitchenSink;

@Component({
  imports: [CommonModule, FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppFormPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected languages = commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      code,
      label: `${flag} ${label}`,
    }));
  protected config: GuiFormInitConfig | undefined;
  protected readonly customFormHealthBoundary = CustomFormHealthBoundaryComponent;

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
    this.loadFormDef();
  }

  private async loadFormDef() {
    const { form } = mock;
    const formDef = typeof form === 'function' ? await form() : form;
    const deps: Dependencies = { markdown: { parse: (md: string) => snarkdown(md) } };
    this.config = {
      formDef,
      data: mock.data,
      meta: mock.meta || {},
      dependencies: deps,
      functions: mock.functions,
      middlewares: [devToolsMiddleware()],
      customWidgetLoaders: {
        heading: async () =>
          (await import('../../custom-widgets/heading/heading.component')).HeadingComponent,
      },
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
  }

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
