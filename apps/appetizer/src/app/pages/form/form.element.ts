import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import * as ValidatorsVanilla from '@golemui/validators';
import i18next from 'i18next';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';

const mock = AppsShared.appetizer;

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = mock.form;
  formData = mock.data;
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
    countryItemRenderer: countryItemRenderer,
  };
  middlewares = [AppsShared.loggerMiddleware];
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

  protected setLanguage(code: string) {
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
          .widgetLoaders=${this.customWidgetLoaders}
          .itemRenderers=${this.itemRenderers}
          .localization=${this.localization}
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
