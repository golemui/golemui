import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { AngularItemRenderer } from '@golemui/angular';
import * as Vanilla from '@golemui/angular-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import i18next from 'i18next';
import { APP_CONFIG } from '../../../environments/environment.model';
import { AirportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { ProductItemRenderer } from '../../item-renderers/product.item-renderer';
import { CountryItemRenderer } from '../../item-renderers/country.item-renderer';

const mock = AppsShared.signin;

@Component({
  imports: [CommonModule, Vanilla.FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppFormPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected localization: Core.I18nTranslator = AppsShared.initializeI18n(mock.resources);
  protected languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      code,
      label: `${flag} ${label}`,
    }));
  protected formDef = mock.form;
  protected formData = mock.data;

  protected middlewares = [AppsShared.loggerMiddleware];
  protected customWidgetLoaders = {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.component')).HeadingComponent,
  };
  protected validators: ValidatorsVanilla.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  protected itemRenderers: Record<string, AngularItemRenderer<any>> = {
    complexListItemRenderer: ComplexListItemRenderer,
    productItemRenderer: ProductItemRenderer,
    airportItemRenderer: AirportItemRenderer,
    countryItemRenderer: CountryItemRenderer,
  };
  protected validateOn: Core.ValidateOn = 'eager';

  protected error = '';

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
  }

  protected onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  protected async onFormEvent(event: Core.FormEvent) {
    await AppsShared.onFormEvent(event);
  }

  protected onLanguageChanged(event: Event) {
    const code = (event as CustomEvent<{ value: string }>).detail.value;
    i18next.changeLanguage(code);
  }
}
