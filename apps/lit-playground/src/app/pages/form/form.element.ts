import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  mockUploadService,
  onFormEvent,
} from '@golemui/apps-shared';
import { type FormEvent, type FormHealth, devToolsMiddleware } from '@golemui/core';
import '@golemui/gui-lit';
import type { FormHealthBoundary } from '@golemui/lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';

const mock = kitchenSink;

const customFormHealthBoundary: FormHealthBoundary = ({ health, form }) => html`
  ${health.status === 'errored'
    ? html`<div
        role="alert"
        style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-left: 4px solid #b91c1c; border-radius: 4px; background: #fef2f2; color: #b91c1c;"
      >
        <strong>This form could not be loaded</strong>
        <div>${health.message}</div>
      </div>`
    : nothing}
  ${form}
`;

@customElement('lit-form')
export class FormElement extends LitElement {
  config: GuiFormInitConfig | undefined;
  languages = commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));

  override async connectedCallback() {
    super.connectedCallback();
    const { form } = mock;
    const formDef = typeof form === 'function' ? await form() : form;
    this.config = {
      formDef,
      data: mock.data,
      meta: mock.meta || {},
      localization: initializeI18n(mock.resources),
      dependencies: {
        markdown: {
          parse: (md: string) => snarkdown(md),
        },
        uploadService: mockUploadService,
      },
      functions: mock.functions,
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
      middlewares: [devToolsMiddleware()],
      customValidators: {
        allowedNames: allowedNames,
      } as CustomValidatorSchemas,
      validateOn: 'eager',
    };
    this.requestUpdate();
  }

  override createRenderRoot() {
    return this;
  }

  protected onFormHealth(event: CustomEvent<FormHealth>) {
    const health = event.detail;
    if (health.status === 'errored') {
      console.log('GolemUI form health error:', health.message);
    }
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected async onFormEvent(event: CustomEvent<FormEvent>) {
    if (mock.onFormEvent) {
      mock.onFormEvent(event.detail);
    }
    onFormEvent(event.detail);
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
        ${config
          ? html`<gui-form
              .config=${config}
              autocomplete="off"
              .formHealthBoundary=${customFormHealthBoundary}
              @formHealth=${this.onFormHealth}
              @formEvent=${this.onFormEvent}
            ></gui-form>`
          : null}
      </div>
    `;
  }
}
