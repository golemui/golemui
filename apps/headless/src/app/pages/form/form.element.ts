import * as AppsShared from '@golemui/apps-shared';
import { iframeResizer } from '@golemui/apps-shared';
import type * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import type * as GuiValidators from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';
import './form.element.scss';

const mock = AppsShared.template;

@customElement('lit-form')
export class FormElement extends LitElement {
  formThemes: string[] = [];
  formDir: string | null = null;
  config: GuiFormInitConfig | undefined;
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

  error = '';

  override createRenderRoot() {
    return this;
  }

  async connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    const params = new URLSearchParams(window.location.search);

    let formDef: any;
    let formData: Record<string, unknown> = {};

    if (params.has('form')) {
      const formDefResponse = await fetch(params.get('form')!);
      formDef = await formDefResponse.json();
    }

    if (params.has('data')) {
      const formDataResponse = await fetch(params.get('data')!);
      formData = await formDataResponse.json();
    }

    if (params.has('theme')) {
      this.formThemes = params.get('theme')?.split('|') ?? [];
    }

    if (params.has('dir')) {
      this.formDir = params.get('dir');
      i18next.changeLanguage('fa');
    }

    this.config = {
      formDef,
      data: formData,
      customWidgetLoaders: this.customWidgetLoaders,
      itemRenderers: this.itemRenderers,
      localization: this.localization,
      middlewares: this.middlewares,
      customValidators: this.customValidators,
      validateOn: this.validateOn,
    };

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

    if (!this.config) {
      return html`<div>loading...</div>`;
    } else {
      return html`
        ${themes.map(
          (theme) => html`
            <div data-theme=${theme ?? nothing}>
              ${this.error ? html`<p class="error">${this.error}</p>` : null}

              <gui-form
                .config=${this.config}
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
