import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import type * as GuiValidators from '@golemui/gui-validators';
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
  config: GuiFormInitConfig | undefined;
  languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));

  error = '';

  override async connectedCallback() {
    super.connectedCallback();
    const { form } = mock;
    const formDef = typeof form === 'function' ? await form() : form;
    this.config = {
      formDef,
      data: mock.data,
      meta: mock.meta || {},
      localization: AppsShared.initializeI18n(mock.resources),
      dependencies: {
        markdown: {
          parse: (md: string) => snarkdown(md),
        },
      },
      customWidgetLoaders: {
        heading: async () =>
          (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
      },
      itemRenderers: {
        complexListItemRenderer,
        productItemRenderer,
        airportItemRenderer,
        countryItemRenderer,
      },
      middlewares: [Core.devToolsMiddleware()],
      customValidators: {
        allowedNames: AppsShared.allowedNames,
      } as GuiValidators.CustomValidatorSchemas,
      validateOn: 'eager',
    };
    this.requestUpdate();
  }

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
    if (mock.onFormEvent) {
      mock.onFormEvent(event.detail);
    }
    AppsShared.onFormEvent(event.detail);
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
    const { config } = this;
    return html`
      <div>
        ${this.languages.length > 0 ? this.languagePicker() : null}
        ${this.error ? html`<p class="error">${this.error}</p>` : null}
        ${config
          ? html`<gui-form
              .config=${config}
              autocomplete="off"
              @formHealth=${this.onFormHealth}
              @formEvent=${this.onFormEvent}
            ></gui-form>`
          : null}
      </div>
    `;
  }
}
