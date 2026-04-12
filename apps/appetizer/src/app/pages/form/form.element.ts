import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import * as GuiValidators from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import './form.element.scss';

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
  itemRenderers = {
    countryItemRenderer: countryItemRenderer,
  };
  middlewares = [AppsShared.loggerMiddleware];
  validators: GuiValidators.CustomValidatorSchemas = {
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
    if (event.detail.name === 'onSelectLanguage') {
      this.onLanguageChanged(event);
    } else {
      await AppsShared.onFormEvent(event.detail);
      Promise.resolve().then(() => this.requestUpdate());
    }
  }

  protected onLanguageChanged(event: CustomEvent<{ data: any }>) {
    const code = event.detail.data.language;
    i18next.changeLanguage(code);
  }

  protected setLanguage(code: string) {
    i18next.changeLanguage(code);
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <gui-form
          .formDef=${this.formDef}
          .data=${this.formData}
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
