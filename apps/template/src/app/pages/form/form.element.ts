import * as AppsShared from '@golemui/apps-shared';
import { iframeResizer } from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { Dependencies } from '@golemui/gui-shared';
import * as GuiValidators from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';
import './form.element.scss';

const mock = AppsShared.template;

@customElement('lit-form')
export class FormElement extends LitElement {
  formThemes: string[] = [];
  formDef = null;
  formDir: string | null = null;
  formData = {};
  localization = AppsShared.initializeI18n(mock.resources);
  languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));
  customWidgetLoaders = {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
    productCard: async () =>
      (await import('../../custom-widgets/product-card/product-card.element')).ProductCardElement,
    productRating: async () =>
      (await import('../../custom-widgets/product-rating/product-rating.element'))
        .ProductRatingElement,
    productDescription: async () =>
      (await import('../../custom-widgets/product-description/product-description.element'))
        .ProductDescriptionElement,
    productShare: async () =>
      (await import('../../custom-widgets/product-share/product-share.element'))
        .ProductShareElement,
  };
  itemRenderers = {
    complexListItemRenderer: complexListItemRenderer,
    productItemRenderer: productItemRenderer,
    airportItemRenderer: airportItemRenderer,
    countryItemRenderer: countryItemRenderer,
  };
  middlewares = [AppsShared.loggerMiddleware];
  customValidators: GuiValidators.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  validateOn: Core.ValidateOn = 'eager';
  deps: Dependencies = {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  async connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    const params = new URLSearchParams(window.location.search);

    if (params.has('form')) {
      const formDefResponse = await fetch(params.get('form')!);
      this.formDef = await formDefResponse.json();
    }

    if (params.has('data')) {
      const formDataResponse = await fetch(params.get('data')!);
      this.formData = await formDataResponse.json();
    } else {
      this.formData = {};
    }

    if (params.has('theme')) {
      this.formThemes = params.get('theme')?.split('|') ?? [];
    }

    if (params.has('dir')) {
      this.formDir = params.get('dir');
      i18next.changeLanguage('fa');
    }

    this.requestUpdate();
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

  render() {
    const themes = this.formThemes.length > 0 ? this.formThemes : [''];

    if (!this.formDef) {
      return html`<div>loading...</div>`;
    } else {
      return html`
        ${themes.map(
          (theme) => html`
            <div data-theme=${theme ?? nothing}>
              ${this.error ? html`<p class="error">${this.error}</p>` : null}

              <gui-form
                .formDef=${this.formDef}
                .data=${this.formData}
                .customWidgetLoaders=${this.customWidgetLoaders}
                .itemRenderers=${this.itemRenderers}
                .localization=${this.localization}
                .middlewares=${this.middlewares}
                .customValidators=${this.customValidators}
                .validateOn=${this.validateOn}
                .dependencies=${this.deps}
                @formHealth=${this.onFormHealth}
                @formEvent=${this.onFormEvent}
              ></gui-form>
            </div>
          `,
        )}
      `;
    }
  }
}
