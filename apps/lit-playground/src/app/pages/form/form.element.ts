import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { Dependencies } from '@golemui/gui-shared';
import * as ValidatorsVanilla from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';
import './form.element.scss';

const mock = AppsShared.kitchenSink;

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = mock.form;
  formData = mock.data;
  formMeta = mock.meta || {};
  localization = AppsShared.initializeI18n(mock.resources);
  deps: Dependencies = {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  };
  languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));
  customWidgetLoaders = {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
  };
  itemRenderers = {
    complexListItemRenderer: complexListItemRenderer,
    productItemRenderer: productItemRenderer,
    airportItemRenderer: airportItemRenderer,
    countryItemRenderer: countryItemRenderer,
  };
  middlewares = [Core.devToolsMiddleware()];
  validators: ValidatorsVanilla.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  validateOn: Core.ValidateOn = 'eager';

  error = '';

  override createRenderRoot() {
    return this;
  }

  protected onFormHealth(event: CustomEvent<Core.FormHealth>) {
    const health = event.detail;
    if (health.status === 'errored') {
      this.error = health.message;
    }
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected async onFormEvent(event: CustomEvent<Core.FormEvent>) {
    await AppsShared.onFormEvent(event.detail);
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected onLanguageChanged(event: CustomEvent<{ value: string }>) {
    const code = event.detail.value;
    i18next.changeLanguage(code);
  }

  private languagePicker() {
    return html`<div>
      <gui-select
        label="Language picker"
        uid="language"
        value="en"
        .options=${this.languages}
        @change=${this.onLanguageChanged}
      ></gui-select>
    </div>`;
  }

  render() {
    return html`
      <div>
        ${this.languages.length > 0 ? this.languagePicker() : null}
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <gui-form
          .formDef=${this.formDef}
          .data=${this.formData}
          .meta=${this.formMeta}
          .widgetLoaders=${this.customWidgetLoaders}
          .itemRenderers=${this.itemRenderers}
          .localization=${this.localization}
          .dependencies=${this.deps}
          .middlewares=${this.middlewares}
          .validators=${this.validators}
          .validateOn=${this.validateOn}
          @formHealth=${this.onFormHealth}
          @formEvent=${this.onFormEvent}
        ></gui-form>
      </div>
    `;
  }
}
